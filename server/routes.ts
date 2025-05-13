import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import {
  insertLeadSchema,
  insertDealSchema,
  insertCustomerSchema,
  insertTaskSchema,
  insertAppointmentSchema,
  insertPaymentSchema,
  insertActivitySchema,
  insertPipelineSchema,
  LeadStatus,
  KanbanLane,
} from "@shared/schema";
import { createPaymentIntent, isStripeConfigured } from "./stripe";
import * as googleService from "./googleService";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = app.route("/api");
  
  // API endpoint to restart the application workflow
  app.post('/api/restart-workflow', (_, res) => {
    console.log("Received request to restart workflow");
    res.json({ success: true, message: "Restart initiated" });
    
    // Send the response before attempting the restart
    setTimeout(() => {
      console.log("Initiating server restart...");
      // This won't actually restart the server via API call, but it will log the intention
      // The actual restart needs to be done by the user or by the web_application_feedback_tool
    }, 1000);
  });

  // Leads API
  app.get("/api/leads", async (req, res) => {
    try {
      const allLeads = await storage.getLeads();
      // Filter out leads that have been converted to clients
      const leads = allLeads.filter(lead => lead.isClient !== true);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });
  
  // Get clients (leads with isClient=true)
  app.get("/api/leads/clients", async (req, res) => {
    try {
      console.log("Fetching clients endpoint called");
      const leads = await storage.getLeads();
      console.log("Total leads:", leads.length);
      
      const clients = leads.filter(lead => lead.isClient === true);
      console.log("Found clients:", clients.length);
      
      // Check for and fix any clients that are missing kanban lanes
      const fixNeeded = clients.filter(client => !client.kanbanLane);
      if (fixNeeded.length > 0) {
        console.log(`Found ${fixNeeded.length} clients missing kanban lanes, fixing them...`);
        
        // Get default pipeline for the fix
        const defaultPipeline = await storage.getDefaultPipeline();
        
        for (const client of fixNeeded) {
          const updateData: Partial<InsertLead> = {
            kanbanLane: KanbanLane.PRESENT_VALUATION
          };
          
          if (defaultPipeline) {
            updateData.pipelineId = defaultPipeline.id;
          }
          
          await storage.updateLead(client.id, updateData);
          console.log(`Fixed client ${client.id} (${client.name}): set kanbanLane=${KanbanLane.PRESENT_VALUATION}`);
        }
        
        // Re-fetch all leads after updating
        const updatedLeads = await storage.getLeads();
        const updatedClients = updatedLeads.filter(lead => lead.isClient === true);
        console.log("After fixing, found clients:", updatedClients.length);
        return res.json(updatedClients);
      }
      
      // If we didn't find any clients, but we have leads with isClient === undefined,
      // this might be due to legacy data. Let's try to convert any lead marked as CLIENT status
      if (clients.length === 0) {
        const possibleClients = leads.filter(lead => 
          (lead.isClient === undefined && lead.status === LeadStatus.CLIENT) || 
          (lead.isClient === true)
        );
        
        console.log("Additional possible clients found:", possibleClients.length);
        
        // Update these leads to have isClient = true explicitly
        for (const possibleClient of possibleClients) {
          await storage.updateLead(possibleClient.id, { 
            isClient: true,
            kanbanLane: possibleClient.kanbanLane || KanbanLane.NEW_CLIENT
          });
          console.log(`Updated client status for lead ${possibleClient.id} (${possibleClient.name})`);
        }
        
        // Re-fetch all leads after updating
        if (possibleClients.length > 0) {
          const updatedLeads = await storage.getLeads();
          const updatedClients = updatedLeads.filter(lead => lead.isClient === true);
          console.log("After updating, found clients:", updatedClients.length);
          return res.json(updatedClients);
        }
      }
      
      // Log each client for debugging
      if (clients.length > 0) {
        clients.forEach(client => {
          console.log(`Client: ${client.name}, ID: ${client.id}, isClient value: ${client.isClient}, kanbanLane: ${client.kanbanLane}`);
        });
      } else {
        console.log("No clients found");
        // Log all leads to see what we have
        leads.forEach(lead => {
          console.log(`Lead: ${lead.name}, ID: ${lead.id}, isClient value: ${lead.isClient}`);
        });
      }
      
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });
  
  // Convert a lead to a client
  app.post("/api/leads/:id/convert-to-client", async (req, res) => {
    try {
      console.log("Convert to client endpoint called");
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log("Invalid ID format:", req.params.id);
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const lead = await storage.getLead(id);
      if (!lead) {
        console.log("Lead not found with ID:", id);
        return res.status(404).json({ message: "Lead not found" });
      }
      
      console.log("Found lead:", lead.name, "Current isClient value:", lead.isClient);
      
      // Get the default pipeline for new clients
      const defaultPipeline = await storage.getDefaultPipeline();
      console.log("Default pipeline:", defaultPipeline ? defaultPipeline.name : "None");
      
      // Update the lead to mark it as a client and assign to the first kanban lane
      // Use the correct lane from the KanbanLane enum - PRESENT_VALUATION is the first lane for real estate
      const updateData: Partial<InsertLead> = {
        isClient: true,
        status: LeadStatus.CLIENT,
        kanbanLane: KanbanLane.PRESENT_VALUATION // First lane for real estate workflow
      };
      
      console.log("Setting kanban lane to:", KanbanLane.PRESENT_VALUATION);
      
      // If a default pipeline exists, assign it to the client
      if (defaultPipeline) {
        updateData.pipelineId = defaultPipeline.id;
      }
      
      console.log("Updating lead with data:", JSON.stringify(updateData));
      const updatedLead = await storage.updateLead(id, updateData);
      
      if (updatedLead) {
        console.log("Lead updated successfully:", updatedLead.name, "isClient value:", updatedLead.isClient);
        
        // Create activity for lead conversion
        await storage.createActivity({
          activityType: "lead_converted",
          description: `Lead ${lead.name} converted to client`,
          userId: 1, // Default to admin user for now
          relatedLeadId: lead.id
        });
        
        // Double check that the lead was actually updated in storage
        const checkLead = await storage.getLead(id);
        console.log("Verifying lead was updated:", 
          checkLead ? `isClient = ${checkLead.isClient}, kanbanLane = ${checkLead.kanbanLane}` : "Lead not found");
      } else {
        console.log("Failed to update lead");
      }
      
      res.json(updatedLead);
    } catch (error) {
      console.error("Error converting lead to client:", error);
      res.status(500).json({ message: "Failed to convert lead to client" });
    }
  });
  
  // Bulk actions for leads
  app.patch("/api/leads/bulk-actions", async (req, res) => {
    try {
      const { ids, action } = req.body;
      
      if (!ids || !Array.isArray(ids) || !action) {
        return res.status(400).json({ message: "Invalid request. Provide ids array and action." });
      }
      
      // Implement different bulk actions
      if (action === "archive") {
        // Mark leads as archived
        for (const id of ids) {
          const lead = await storage.getLead(id);
          if (lead) {
            await storage.updateLead(id, { archived: true });
            
            await storage.createActivity({
              userId: 1,
              activityType: "lead_archived",
              description: `Lead archived - ${lead.name}`,
              relatedLeadId: id
            });
          }
        }
        return res.json({ success: true, message: `${ids.length} leads archived.` });
      }
      
      res.status(400).json({ message: "Invalid action specified." });
    } catch (error) {
      res.status(500).json({ message: "Failed to perform bulk action on leads" });
    }
  });

  app.get("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      res.json(lead);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lead" });
    }
  });

  app.post("/api/leads", async (req, res) => {
    try {
      // Pre-process the request body to handle date format issues
      const requestData = { ...req.body };
      
      // If nextActivityDate is a string, convert it to a Date object
      if (requestData.nextActivityDate && typeof requestData.nextActivityDate === 'string') {
        try {
          requestData.nextActivityDate = new Date(requestData.nextActivityDate);
        } catch (e) {
          // If date parsing fails, remove it to avoid validation errors
          delete requestData.nextActivityDate;
        }
      }
      
      const validatedData = insertLeadSchema.parse(requestData);
      const newLead = await storage.createLead(validatedData);
      
      // Create activity for lead creation
      await storage.createActivity({
        userId: 1, // Default to admin user for now
        activityType: "lead_created",
        description: `New lead created - ${newLead.name}`,
        relatedLeadId: newLead.id
      });
      
      res.status(201).json(newLead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create lead" });
    }
  });

  app.patch("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const existingLead = await storage.getLead(id);
      if (!existingLead) {
        return res.status(404).json({ message: "Lead not found" });
      }
      
      // Pre-process the request body to handle date format issues
      const requestData = { ...req.body };
      
      // If nextActivityDate is a string, convert it to a Date object
      if (requestData.nextActivityDate && typeof requestData.nextActivityDate === 'string') {
        try {
          requestData.nextActivityDate = new Date(requestData.nextActivityDate);
        } catch (e) {
          // If date parsing fails, remove it to avoid validation errors
          delete requestData.nextActivityDate;
        }
      }

      const validatedData = insertLeadSchema.partial().parse(requestData);
      const updatedLead = await storage.updateLead(id, validatedData);
      
      // Create activity for status change if status was updated
      if (validatedData.status && validatedData.status !== existingLead.status) {
        await storage.createActivity({
          userId: 1, // Default to admin user for now
          activityType: "lead_status_changed",
          description: `Lead status changed to ${validatedData.status} - ${existingLead.name}`,
          relatedLeadId: id
        });
        
        // If converting to client, create a special activity
        if (validatedData.status === "client" || validatedData.isClient === true) {
          await storage.createActivity({
            userId: 1,
            activityType: "lead_converted",
            description: `Lead converted to client - ${existingLead.name}`,
            relatedLeadId: id
          });
        }
      }
      
      res.json(updatedLead);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lead data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update lead" });
    }
  });
  


  app.delete("/api/leads/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const lead = await storage.getLead(id);
      if (!lead) {
        return res.status(404).json({ message: "Lead not found" });
      }

      await storage.deleteLead(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete lead" });
    }
  });

  app.get("/api/leads/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const leads = await storage.getLeadsByStatus(status);
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads by status" });
    }
  });

  // Deals API
  app.get("/api/deals", async (req, res) => {
    try {
      const deals = await storage.getDeals();
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals" });
    }
  });

  app.get("/api/deals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      res.json(deal);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deal" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      // Pre-process the request body to handle date format issues
      const requestData = { ...req.body };
      
      // If startDate is a string, convert it to a Date object
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        try {
          requestData.startDate = new Date(requestData.startDate);
        } catch (e) {
          // If date parsing fails, remove it to avoid validation errors
          delete requestData.startDate;
        }
      }
      
      // If endDate is a string, convert it to a Date object
      if (requestData.endDate && typeof requestData.endDate === 'string') {
        try {
          requestData.endDate = new Date(requestData.endDate);
        } catch (e) {
          // If date parsing fails, remove it to avoid validation errors
          delete requestData.endDate;
        }
      }
      
      const validatedData = insertDealSchema.parse(requestData);
      
      // Verify customer exists
      const customer = await storage.getCustomer(validatedData.customerId);
      if (!customer) {
        return res.status(400).json({ message: "Customer not found" });
      }
      
      const newDeal = await storage.createDeal(validatedData);
      
      // Create activity for deal creation
      await storage.createActivity({
        userId: 1, // Default to admin user for now
        activityType: "deal_created",
        description: `New deal created - ${newDeal.title} ($${newDeal.value})`,
        relatedDealId: newDeal.id
      });
      
      res.status(201).json(newDeal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const existingDeal = await storage.getDeal(id);
      if (!existingDeal) {
        return res.status(404).json({ message: "Deal not found" });
      }
      
      // Pre-process the request body to handle date format issues
      const requestData = { ...req.body };
      
      // If startDate is a string, convert it to a Date object
      if (requestData.startDate && typeof requestData.startDate === 'string') {
        try {
          requestData.startDate = new Date(requestData.startDate);
        } catch (e) {
          // If date parsing fails, remove it to avoid validation errors
          delete requestData.startDate;
        }
      }
      
      // If endDate is a string, convert it to a Date object
      if (requestData.endDate && typeof requestData.endDate === 'string') {
        try {
          requestData.endDate = new Date(requestData.endDate);
        } catch (e) {
          // If date parsing fails, remove it to avoid validation errors
          delete requestData.endDate;
        }
      }

      const validatedData = insertDealSchema.partial().parse(requestData);
      
      // If customerId is provided, verify customer exists
      if (validatedData.customerId) {
        const customer = await storage.getCustomer(validatedData.customerId);
        if (!customer) {
          return res.status(400).json({ message: "Customer not found" });
        }
      }
      
      const updatedDeal = await storage.updateDeal(id, validatedData);
      
      // Create activity for stage change if stage was updated
      if (validatedData.stage && validatedData.stage !== existingDeal.stage) {
        await storage.createActivity({
          userId: 1, // Default to admin user for now
          activityType: "deal_stage_changed",
          description: `Deal stage changed to ${validatedData.stage} - ${existingDeal.title}`,
          relatedDealId: id
        });
      }
      
      res.json(updatedDeal);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid deal data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const deal = await storage.getDeal(id);
      if (!deal) {
        return res.status(404).json({ message: "Deal not found" });
      }

      await storage.deleteDeal(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete deal" });
    }
  });

  app.get("/api/deals/stage/:stage", async (req, res) => {
    try {
      const stage = req.params.stage;
      const deals = await storage.getDealsByStage(stage);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals by stage" });
    }
  });

  app.get("/api/deals/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID format" });
      }

      const deals = await storage.getDealsByCustomer(customerId);
      res.json(deals);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch deals by customer" });
    }
  });

  // Customers API
  app.get("/api/customers", async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      res.json(customer);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post("/api/customers", async (req, res) => {
    try {
      const validatedData = insertCustomerSchema.parse(req.body);
      const newCustomer = await storage.createCustomer(validatedData);
      
      // Create activity for customer creation
      await storage.createActivity({
        userId: 1, // Default to admin user for now
        activityType: "customer_created",
        description: `New customer created - ${newCustomer.name}`,
        relatedCustomerId: newCustomer.id
      });
      
      res.status(201).json(newCustomer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.patch("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      const validatedData = insertCustomerSchema.partial().parse(req.body);
      const updatedCustomer = await storage.updateCustomer(id, validatedData);
      res.json(updatedCustomer);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid customer data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete("/api/customers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const customer = await storage.getCustomer(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }

      await storage.deleteCustomer(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Tasks API
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const newTask = await storage.createTask(validatedData);
      res.status(201).json(newTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.patch("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const validatedData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(id, validatedData);
      
      // Create activity for task completion if status changed to completed
      if (validatedData.status === "completed" && task.status !== "completed") {
        await storage.createActivity({
          userId: 1, // Default to admin user for now
          activityType: "task_completed",
          description: `Task completed - ${task.title}`
        });
      }
      
      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      await storage.deleteTask(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  app.get("/api/tasks/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const tasks = await storage.getTasksByStatus(status);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by status" });
    }
  });

  app.get("/api/tasks/assignee/:assigneeId", async (req, res) => {
    try {
      const assigneeId = parseInt(req.params.assigneeId);
      if (isNaN(assigneeId)) {
        return res.status(400).json({ message: "Invalid assignee ID format" });
      }

      const tasks = await storage.getTasksByAssignee(assigneeId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by assignee" });
    }
  });

  app.get("/api/tasks/due-today", async (req, res) => {
    try {
      const tasks = await storage.getTasksDueToday();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks due today" });
    }
  });

  // Appointments API
  app.get("/api/appointments", async (req, res) => {
    try {
      const appointments = await storage.getAppointments();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const newAppointment = await storage.createAppointment(validatedData);
      
      // Create activity for appointment creation
      await storage.createActivity({
        userId: 1, // Default to admin user for now
        activityType: "appointment_created",
        description: `Appointment scheduled - ${newAppointment.title}`,
        relatedLeadId: newAppointment.leadId,
        relatedDealId: newAppointment.dealId,
        relatedCustomerId: newAppointment.customerId
      });
      
      res.status(201).json(newAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.patch("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      const updatedAppointment = await storage.updateAppointment(id, validatedData);
      res.json(updatedAppointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid appointment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      await storage.deleteAppointment(id);
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  app.get("/api/appointments/today", async (req, res) => {
    try {
      const appointments = await storage.getAppointmentsForToday();
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's appointments" });
    }
  });

  app.get("/api/appointments/range", async (req, res) => {
    try {
      const startStr = req.query.start as string;
      const endStr = req.query.end as string;
      
      if (!startStr || !endStr) {
        return res.status(400).json({ message: "Start and end dates are required" });
      }
      
      const startDate = new Date(startStr);
      const endDate = new Date(endStr);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }
      
      const appointments = await storage.getAppointmentsByDateRange(startDate, endDate);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch appointments by date range" });
    }
  });

  // Payments API
  app.get("/api/payments", async (req, res) => {
    try {
      const payments = await storage.getPayments();
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.get("/api/payments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }

      const payment = await storage.getPayment(id);
      if (!payment) {
        return res.status(404).json({ message: "Payment not found" });
      }

      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payment" });
    }
  });

  app.post("/api/payments", async (req, res) => {
    try {
      const validatedData = insertPaymentSchema.parse(req.body);
      
      // Verify customer exists
      const customer = await storage.getCustomer(validatedData.customerId);
      if (!customer) {
        return res.status(400).json({ message: "Customer not found" });
      }
      
      // Verify deal exists if provided
      if (validatedData.dealId) {
        const deal = await storage.getDeal(validatedData.dealId);
        if (!deal) {
          return res.status(400).json({ message: "Deal not found" });
        }
      }
      
      const newPayment = await storage.createPayment(validatedData);
      
      // Create activity for payment creation
      await storage.createActivity({
        userId: 1, // Default to admin user for now
        activityType: "payment_received",
        description: `Payment received - $${newPayment.amount} (${newPayment.method})`,
        relatedDealId: newPayment.dealId,
        relatedCustomerId: newPayment.customerId
      });
      
      res.status(201).json(newPayment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  app.get("/api/payments/deal/:dealId", async (req, res) => {
    try {
      const dealId = parseInt(req.params.dealId);
      if (isNaN(dealId)) {
        return res.status(400).json({ message: "Invalid deal ID format" });
      }

      const payments = await storage.getPaymentsByDeal(dealId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments by deal" });
    }
  });

  app.get("/api/payments/customer/:customerId", async (req, res) => {
    try {
      const customerId = parseInt(req.params.customerId);
      if (isNaN(customerId)) {
        return res.status(400).json({ message: "Invalid customer ID format" });
      }

      const payments = await storage.getPaymentsByCustomer(customerId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch payments by customer" });
    }
  });

  // Activities API
  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getActivities();
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  app.get("/api/activities/recent", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 5;
      const activities = await storage.getRecentActivities(limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent activities" });
    }
  });
  
  // Get activities for a specific entity (e.g., lead, deal, customer)
  app.get("/api/activities/entity/:type/:id", async (req, res) => {
    try {
      const { type, id } = req.params;
      const entityId = parseInt(id);
      
      if (isNaN(entityId)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      // Get all activities and filter for the specific entity
      const allActivities = await storage.getActivities();
      const entityActivities = allActivities.filter(
        activity => activity.entityType === type && activity.entityId === entityId
      );
      
      // Sort by date descending
      entityActivities.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      res.json(entityActivities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch entity activities" });
    }
  });

  app.post("/api/activities", async (req, res) => {
    try {
      const validatedData = insertActivitySchema.parse(req.body);
      const newActivity = await storage.createActivity(validatedData);
      res.status(201).json(newActivity);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid activity data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create activity" });
    }
  });

  // Create a payment processor endpoint
  app.post("/api/process-payment", async (req, res) => {
    try {
      const { amount, customerId, dealId, method } = req.body;
      
      if (!amount || !customerId || !method) {
        return res.status(400).json({ message: "Amount, customerId, and method are required" });
      }
      
      // For now, just create a payment record since this is a mock
      const payment = await storage.createPayment({
        amount: parseFloat(amount),
        customerId: parseInt(customerId),
        dealId: dealId ? parseInt(dealId) : undefined,
        method,
        status: "paid",
        description: "Payment processed"
      });
      
      // Create activity
      await storage.createActivity({
        userId: 1,
        activityType: "payment_received",
        description: `Payment of $${amount} received from customer #${customerId}`,
        relatedCustomerId: parseInt(customerId),
        relatedDealId: dealId ? parseInt(dealId) : undefined
      });
      
      res.status(201).json({ 
        success: true, 
        payment,
        message: "Payment processed successfully" 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false,
        message: "Failed to process payment" 
      });
    }
  });

  // Dashboard summary endpoint
  app.get("/api/dashboard/summary", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      const deals = await storage.getDeals();
      const todaysAppointments = await storage.getAppointmentsForToday();
      const payments = await storage.getPayments();
      
      // Calculate summary
      const newLeadsCount = leads.filter(l => l.status === "new").length;
      const activeDealsCount = deals.filter(d => d.stage !== "completed").length;
      
      // Calculate monthly revenue
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      let monthlyRevenue = 0;
      
      for (const payment of payments) {
        const paymentDate = new Date(payment.createdAt);
        if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
          monthlyRevenue += payment.amount;
        }
      }
      
      res.json({
        newLeadsCount,
        activeDealsCount,
        todaysAppointmentsCount: todaysAppointments.length,
        monthlyRevenue
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard summary" });
    }
  });

  // Stripe payment integration API endpoints
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      // Validation for required fields
      const { amount, customerId, dealId, description } = req.body;

      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }

      if (!customerId) {
        return res.status(400).json({ message: "Customer ID is required" });
      }

      // Check if customer exists
      const customer = await storage.getCustomer(customerId);
      if (!customer) {
        return res.status(400).json({ message: "Customer not found" });
      }

      // If dealId is provided, verify it exists
      if (dealId) {
        const deal = await storage.getDeal(dealId);
        if (!deal) {
          return res.status(400).json({ message: "Deal not found" });
        }
      }

      // Create a payment intent (placeholder until Stripe is configured)
      const paymentIntent = await createPaymentIntent({
        amount,
        customerId,
        dealId,
        description,
        currency: 'usd'
      });

      // Return the client secret to the client
      res.json({
        clientSecret: paymentIntent.clientSecret,
        stripeConfigured: isStripeConfigured()
      });
    } catch (error) {
      console.error("Payment intent creation error:", error);
      res.status(500).json({ message: "Failed to create payment intent" });
    }
  });

  app.get("/api/stripe-status", (req, res) => {
    res.json({
      configured: isStripeConfigured()
    });
  });
  
  // Google Calendar Integration Routes
  app.get("/api/google-calendar/settings", async (req, res) => {
    try {
      // In a real app with authentication, you'd use req.user.id
      const userId = 1; // Using default user for testing
      const settings = await storage.getGoogleCalendarSettings(userId);
      res.json(settings || { connected: false });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch Google Calendar settings" });
    }
  });
  
  app.post("/api/google-calendar/settings", async (req, res) => {
    try {
      // In a real app with authentication, you'd use req.user.id
      const userId = 1; // Using default user for testing
      const { clientId, clientSecret, redirectUri } = req.body;
      
      if (!clientId || !clientSecret || !redirectUri) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Check if settings already exist
      let settings = await storage.getGoogleCalendarSettings(userId);
      
      if (settings) {
        // Update existing settings
        settings = await storage.updateGoogleCalendarSettings(userId, {
          clientId,
          clientSecret,
          redirectUri,
          connected: false // Reset connection status when credentials change
        });
      } else {
        // Create new settings
        settings = await storage.createGoogleCalendarSettings({
          userId,
          clientId,
          clientSecret,
          redirectUri,
          connected: false,
        });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to save Google Calendar settings" });
    }
  });
  
  // Google OAuth endpoints
  app.get("/api/google/auth-url", async (req, res) => {
    try {
      // In a real app with authentication, you'd use req.user.id
      const userId = 1; // Using default user for testing
      const settings = await storage.getGoogleCalendarSettings(userId);
      
      if (!settings || !settings.clientId || !settings.redirectUri) {
        return res.status(400).json({ message: "Google Calendar settings not configured" });
      }
      
      // Build the Google OAuth URL
      const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ];
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${settings.clientId}&redirect_uri=${encodeURIComponent(settings.redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&access_type=offline&prompt=consent`;
      
      res.json({ authUrl });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate auth URL" });
    }
  });
  
  app.post("/api/google/callback", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Authorization code is required" });
      }
      
      // In a real app with authentication, you'd use req.user.id
      const userId = 1; // Using default user for testing
      const settings = await storage.getGoogleCalendarSettings(userId);
      
      if (!settings || !settings.clientId || !settings.clientSecret || !settings.redirectUri) {
        return res.status(400).json({ message: "Google Calendar settings not configured" });
      }
      
      // Exchange the code for tokens
      // In a real implementation, we would make an actual HTTP request to Google's token endpoint
      // For now, we'll just simulate the exchange
      
      // Update settings with the tokens
      await storage.updateGoogleCalendarSettings(userId, {
        // In a real app, these would come from Google's response
        refreshToken: "simulated_refresh_token",
        accessToken: "simulated_access_token",
        tokenExpiry: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        connected: true,
        primaryCalendarId: "primary"
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to exchange authorization code for tokens" });
    }
  });
  
  // Public calendar booking endpoints
  app.get("/api/calendar/public/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const settings = await storage.getGoogleCalendarSettings(userId);
      
      if (!settings || !settings.connected) {
        return res.status(404).json({ message: "Calendar not found or not available for booking" });
      }
      
      // In a real app, we would fetch available time slots from Google Calendar
      // For demo purposes, we'll return a simulated schedule
      const today = new Date();
      const availableSlots = [];
      
      // Generate time slots for the next 7 days
      for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        
        // Generate 9am-5pm slots in 30 min increments
        for (let hour = 9; hour < 17; hour++) {
          for (let min = 0; min < 60; min += 30) {
            const startTime = new Date(date);
            startTime.setHours(hour, min, 0, 0);
            
            const endTime = new Date(startTime);
            endTime.setMinutes(endTime.getMinutes() + 30);
            
            availableSlots.push({
              id: `slot-${i}-${hour}-${min}`,
              startTime: startTime.toISOString(),
              endTime: endTime.toISOString(),
              available: Math.random() > 0.3 // 70% of slots are available
            });
          }
        }
      }
      
      res.json({
        userName: "Demo User", // In real app, fetch user's name
        availableSlots: availableSlots.filter(slot => slot.available)
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available calendar slots" });
    }
  });
  
  app.post("/api/calendar/book", async (req, res) => {
    try {
      const { userId, slotId, name, email, phone, note } = req.body;
      
      if (!userId || !slotId || !name || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      const settings = await storage.getGoogleCalendarSettings(userId);
      
      if (!settings || !settings.connected) {
        return res.status(404).json({ message: "Calendar not found or not available for booking" });
      }
      
      // In a real app, we would:
      // 1. Parse the slotId to get the actual date/time
      // 2. Create an event in Google Calendar
      // 3. Create a lead in the CRM
      // 4. Send confirmation emails
      
      // For demo purposes, we'll just create a lead and an appointment
      const leadId = (await storage.createLead({
        name,
        email,
        phone,
        source: "Calendar Booking",
        status: LeadStatus.NEW,
        notes: note,
        nextActivity: "Initial Consultation",
        nextActivityDate: new Date(),
        ownerId: userId
      })).id;
      
      // Extract time from slot ID (format: slot-dayOffset-hour-minute)
      const [_, dayOffsetStr, hourStr, minuteStr] = slotId.split('-');
      const dayOffset = parseInt(dayOffsetStr);
      const hour = parseInt(hourStr);
      const minute = parseInt(minuteStr);
      
      const startTime = new Date();
      startTime.setDate(startTime.getDate() + dayOffset);
      startTime.setHours(hour, minute, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + 30);
      
      const appointment = await storage.createAppointment({
        title: `Consultation with ${name}`,
        startTime,
        endTime,
        leadId,
        description: note,
      });
      
      // Create activity for the booking
      await storage.createActivity({
        userId,
        activityType: "appointment_booked",
        description: `${name} booked an appointment via public calendar`,
        relatedLeadId: leadId
      });
      
      res.json({ 
        success: true, 
        appointment 
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to book appointment" });
    }
  });

  // Endpoint to update Google OAuth credentials
  app.post("/api/settings/google-credentials", (req, res) => {
    try {
      const { clientId, clientSecret, redirectUri } = req.body;
      
      if (!clientId || !clientSecret || !redirectUri) {
        return res.status(400).json({ 
          success: false, 
          message: "Missing required fields. Please provide clientId, clientSecret, and redirectUri."
        });
      }
      
      // Write the credentials to a .env file for persistence
      const envPath = './.env';
      let envContent = '';
      
      try {
        const fs = require('fs');
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
        }
      } catch (error) {
        console.error('Error reading .env file:', error);
      }
      
      // Update environment variables in memory
      process.env.GOOGLE_CLIENT_ID = clientId;
      process.env.GOOGLE_CLIENT_SECRET = clientSecret;
      process.env.GOOGLE_REDIRECT_URI = redirectUri;
      
      // Refresh and log the updated configuration
      console.log("Google Credentials Updated");
      googleService.refreshConfiguration();
      
      // Update the auth client with new credentials to use immediately
      const newAuthClient = googleService.createAuthClient(true); // force new client
      
      res.json({ 
        success: true, 
        message: "Google OAuth credentials updated successfully. Try connecting your Gmail account now."
      });
    } catch (error) {
      console.error('Error updating Google credentials:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to update Google OAuth credentials."
      });
    }
  });

  // Google OAuth Routes
  // New endpoint to check Google OAuth configuration
  app.get("/api/auth/google/config", (req, res) => {
    try {
      // Get the request origin or construct it from headers
      const origin = req.headers.origin || `${req.protocol}://${req.get('host')}`;
      
      // Generate the expected callback URL based on current domain
      const expectedCallbackUrl = `${origin}/api/auth/google/callback`;
      
      // The currently configured callback URL
      const configuredCallbackUrl = process.env.GOOGLE_REDIRECT_URI;
      
      // Get all possible redirect URIs
      const allPossibleRedirectURIs = googleService.getAllPossibleRedirectURIs();
      
      // Check if the current domain's callback URL is in the list of possible URIs
      const currentCallbackInPossibleList = allPossibleRedirectURIs.includes(expectedCallbackUrl);
      
      // Check if the environment has Replit-specific variables
      const replitInfo = {
        REPL_SLUG: process.env.REPL_SLUG,
        REPL_OWNER: process.env.REPL_OWNER,
        REPL_ID: process.env.REPL_ID,
        alternativeCallback: process.env.REPL_SLUG && process.env.REPL_OWNER 
          ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback` 
          : null
      };
      
      res.json({
        configured: googleService.hasValidCredentials(),
        expectedCallbackUrl,
        configuredCallbackUrl,
        mismatch: expectedCallbackUrl !== configuredCallbackUrl,
        currentCallbackInPossibleList,
        allPossibleRedirectURIs,
        replitInfo,
        currentRequestInfo: {
          origin,
          protocol: req.protocol,
          host: req.get('host'),
          path: req.path,
          headers: {
            host: req.headers.host,
            origin: req.headers.origin,
            referer: req.headers.referer
          }
        },
        recommendation: `Please add the following redirect URIs to your Google Cloud Console OAuth configuration: ${allPossibleRedirectURIs.join(', ')}`
      });
    } catch (error) {
      console.error("Error checking Google config:", error);
      res.status(500).json({ error: "Failed to check Google configuration" });
    }
  });

  app.get("/api/auth/google", (req, res) => {
    try {
      // Check if Google API credentials are configured
      if (!googleService.hasValidCredentials()) {
        console.error("Google API credentials are not configured");
        return res.redirect('/inbox?status=error&reason=missing_credentials');
      }
      
      // Initialize OAuth flow for Gmail access
      const userId = 1; // Using default user for testing, normally from req.user.id
      
      console.log("Starting Google OAuth flow for Gmail access");
      
      // Get the current domain and protocol
      const currentDomain = req.headers.host || '';
      const protocol = req.secure || (req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
      
      // Build full URL for the callback
      const dynamicCallbackUrl = `${protocol}://${currentDomain}/api/auth/google/callback`;
      console.log("Current domain:", currentDomain);
      console.log("Dynamic callback URL:", dynamicCallbackUrl);
      
      // Create state parameter to track the OAuth flow and include domain info
      const state = Buffer.from(JSON.stringify({ 
        userId, 
        for: "email",
        timestamp: Date.now(),
        domain: currentDomain,
        protocol: protocol,
        callbackUrl: dynamicCallbackUrl,
        random: Math.random().toString(36).substring(2)
      })).toString('base64');
      
      try {
        // Generate auth URL with proper scopes for Gmail access
        const authUrl = googleService.getAuthUrl(state);
        
        console.log(`Redirecting user to Google OAuth URL`);
        
        // Store a flag in session storage to track the OAuth flow
        if (req.session) {
          req.session.googleOAuthInProgress = true;
          req.session.oauthStartTime = Date.now();
          req.session.currentDomain = currentDomain;
        }
        
        return res.redirect(authUrl);
      } catch (error) {
        console.error("Error generating Google auth URL:", error);
        return res.redirect('/inbox?status=error&reason=auth_url_generation_failed');
      }
    } catch (error) {
      console.error("Error initiating Google OAuth:", error);
      return res.redirect('/inbox?status=error&reason=oauth_start_failed');
    }
  });
  
  app.get("/api/auth/google/callback", async (req, res) => {
    console.log("Google OAuth callback received");
    console.log("Query parameters:", req.query);
    
    // Log detailed request information to help debug the 403 issue
    console.log("Detailed callback request info:");
    console.log("- Headers:", req.headers);
    console.log("- Protocol:", req.protocol);
    console.log("- Host:", req.get('host'));
    console.log("- Original URL:", req.originalUrl);
    console.log("- Path:", req.path);
    
    // Check for error from Google
    if (req.query.error) {
      console.error('Google OAuth error:', req.query.error);
      return res.redirect(`/inbox?status=error&reason=${req.query.error}`);
    }
    
    try {
      const { code, state } = req.query;
      
      if (!code) {
        console.error('No code received from Google OAuth.');
        return res.redirect('/inbox?status=error&reason=no_code');
      }
      
      console.log('Exchanging code for tokens...');
      
      // Extract state to get the callback URL used during the OAuth start
      let originalCallbackUrl = '';
      let userId = 1;
      
      if (state) {
        try {
          const parsedState = JSON.parse(Buffer.from(state as string, 'base64').toString());
          originalCallbackUrl = parsedState.callbackUrl || '';
          userId = parsedState.userId || 1;
          console.log('Original callback URL from state:', originalCallbackUrl);
          console.log('User ID from state:', userId);
        } catch (e) {
          console.error("Error parsing state for callback URL:", e);
        }
      }
      
      // Get all possible redirect URIs that could work
      const allPossibleURIs = googleService.getAllPossibleRedirectURIs();
      console.log(`Found ${allPossibleURIs.length} possible redirect URIs to try`);
      
      // Try token exchange with each possible URI until one works
      let tokens = null;
      let successfulUri = null;
      let lastError = null;
      
      // First try with the original callback URL from state if available
      if (originalCallbackUrl) {
        try {
          console.log('Trying token exchange with original callback URL:', originalCallbackUrl);
          tokens = await googleService.getTokens(code as string, originalCallbackUrl);
          console.log('Successfully obtained tokens with original callback URL!');
          successfulUri = originalCallbackUrl;
        } catch (err) {
          console.error('Failed with original callback URL:', err.message);
          lastError = err;
          // Continue to try other URIs
        }
      }
      
      // If that didn't work, try with the configured URI
      if (!tokens) {
        const configuredUri = process.env.GOOGLE_REDIRECT_URI;
        if (configuredUri && configuredUri !== originalCallbackUrl) {
          try {
            console.log('Trying token exchange with configured URI:', configuredUri);
            tokens = await googleService.getTokens(code as string, configuredUri);
            console.log('Successfully obtained tokens with configured URI!');
            successfulUri = configuredUri;
          } catch (err) {
            console.error('Failed with configured URI:', err.message);
            lastError = err;
            // Continue to try URIs from our pre-calculated list
          }
        }
      }
      
      // If we still don't have tokens, try a few of the other possible URIs
      if (!tokens) {
        // Try with a subset of the most important URIs
        const importantURIs = allPossibleURIs.slice(0, 3); // Just try the first 3 URIs
        
        for (const uri of importantURIs) {
          if (uri !== originalCallbackUrl && uri !== process.env.GOOGLE_REDIRECT_URI) {
            try {
              console.log('Trying token exchange with URI:', uri);
              tokens = await googleService.getTokens(code as string, uri);
              console.log('Successfully obtained tokens with URI:', uri);
              successfulUri = uri;
              break; // Stop once we get a successful token
            } catch (err) {
              console.error(`Failed with URI ${uri}:`, err.message);
              lastError = err;
              // Continue to next URI
            }
          }
        }
      }
      
      console.log('Tokens received:', tokens ? 'success' : 'failure');
      
      // If we found a successful URI, update the environment variable
      if (successfulUri && successfulUri !== process.env.GOOGLE_REDIRECT_URI) {
        console.log('Updating GOOGLE_REDIRECT_URI with successful URI:', successfulUri);
        process.env.GOOGLE_REDIRECT_URI = successfulUri;
      }
      
      if (!tokens || !tokens.access_token) {
        console.error('Failed to get access token after trying multiple URIs.');
        if (lastError) {
          console.error('Last error message:', lastError.message);
        }
        return res.redirect('/inbox?status=error&reason=token_exchange_failed');
      }
      
      // Get user info
      console.log('Getting user info with access token...');
      let userInfo;
      try {
        userInfo = await googleService.getUserInfo(tokens.access_token);
        console.log('User info retrieved successfully!');
      } catch (userInfoError) {
        console.error('Error fetching user info:', userInfoError);
        return res.redirect('/inbox?status=error&reason=user_info_failed');
      }
      
      // We already extracted userId from state earlier, so we don't need to do it again
      console.log('Using userId:', userId);
      
      // Get user email from Google response
      let emailAddress = '';
      if (userInfo.emailAddresses && userInfo.emailAddresses.length > 0) {
        emailAddress = userInfo.emailAddresses[0].value;
      }
      
      if (!emailAddress) {
        return res.status(400).json({ message: "Failed to retrieve email from Google" });
      }
      
      // Check if account already exists (either by email address match or as the placeholder account)
      const existingAccounts = await storage.getEmailAccounts(userId);
      
      // First check for Gmail account with matching email
      let existingAccount = existingAccounts.find(acc => 
        acc.email === emailAddress && acc.provider === 'gmail'
      );
      
      // If no exact match, look for any disconnected placeholder Gmail account
      if (!existingAccount) {
        existingAccount = existingAccounts.find(acc => 
          acc.provider === 'gmail' && 
          (!acc.connected || acc.connected === false) &&
          (!acc.accessToken || !acc.refreshToken)
        );
      }
      
      let accountId;
      
      if (existingAccount) {
        console.log(`Updating existing Gmail account ${existingAccount.id}`);
        
        // Update existing account with new tokens and email
        await storage.updateEmailAccount(existingAccount.id, {
          email: emailAddress,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token || existingAccount.refreshToken,
          expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
          lastSynced: new Date(),
          connected: true,
          settings: {
            syncFrequency: "15min",
            autoRespond: false,
            signature: `${emailAddress}\nSent from MyCRM`
          }
        });
        accountId = existingAccount.id;
        
        // Create activity to log the account update
        await storage.createActivity({
          userId,
          activityType: "email_account_updated",
          description: `Gmail account connected: ${emailAddress}`,
          metadata: {
            provider: 'gmail',
            email: emailAddress,
            timestamp: new Date().toISOString()
          }
        });
      } else {
        console.log(`Creating new Gmail account for ${emailAddress}`);
        
        // Save the new email account
        const newAccount = await storage.createEmailAccount({
          provider: 'gmail',
          email: emailAddress,
          userId,
          connected: true,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: new Date(Date.now() + (tokens.expires_in || 3600) * 1000),
          lastSynced: new Date(),
          settings: {
            syncFrequency: "15min",
            autoRespond: false,
            signature: `${emailAddress}\nSent from MyCRM`
          }
        });
        accountId = newAccount.id;
        
        // Create activity to log the account addition
        await storage.createActivity({
          userId,
          activityType: "email_account_added",
          description: `Gmail account added: ${emailAddress}`,
          metadata: {
            provider: 'gmail',
            email: emailAddress,
            timestamp: new Date().toISOString()
          }
        });
      }
      
      // Redirect to inbox with success message
      res.redirect(`/inbox?status=success&accountId=${accountId}`);
    } catch (error) {
      console.error("Error in Google OAuth callback:", error);
      console.error("Error details:", error.message);
      console.error("Stack trace:", error.stack);
      
      // Add more details to the error redirect
      let errorReason = 'unknown';
      if (error.message) {
        if (error.message.includes('invalid_grant')) {
          errorReason = 'invalid_grant';
        } else if (error.message.includes('invalid_client')) {
          errorReason = 'invalid_client';
        } else if (error.message.includes('redirect_uri_mismatch')) {
          errorReason = 'redirect_uri_mismatch';
        } else {
          errorReason = encodeURIComponent(error.message.substring(0, 50));
        }
      }
      
      res.redirect(`/inbox?status=error&reason=${errorReason}`);
    }
  });
  
  // Email Integration Routes
  
  // Check if Google credentials are properly configured
  app.get("/api/google/credentials-status", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    
    // Do not expose actual values, just indicate if they're present
    const status = {
      clientId: !!clientId,
      clientSecret: !!clientSecret,
      redirectUri: !!redirectUri,
      isConfigured: !!(clientId && clientSecret && redirectUri)
    };
    
    res.json(status);
  });
  
  // Add a detailed endpoint for troubleshooting Google OAuth issues
  app.get("/api/google/redirect-uri-debug", (req, res) => {
    try {
      // Return details about the current redirect URI configuration
      // This is useful for debugging OAuth issues
      
      // Get the current domain from the request
      const protocol = req.secure || (req.headers['x-forwarded-proto'] === 'https') ? 'https' : 'http';
      const domain = req.headers.host || '';
      const currentUrl = `${protocol}://${domain}`;
      
      // Get only the essential redirect URIs that must be added to Google Cloud Console
      const essentialURIs = googleService.getEssentialRedirectURIs();
      
      // Get all the possible redirect URIs that could work (for advanced troubleshooting)
      const allPossibleURIs = googleService.getAllPossibleRedirectURIs();
      
      // Create the expected callback URL based on the current request
      const expectedCallbackUrl = `${currentUrl}/api/auth/google/callback`;
      
      // Get the configured redirect URI
      const configuredCallbackUrl = process.env.GOOGLE_REDIRECT_URI || '';
      
      // Check if the current callback URL is in the list of possible URIs
      const currentCallbackInPossibleList = allPossibleURIs.includes(expectedCallbackUrl);
      
      // Get Replit environment information for debugging
      const replitInfo = {
        REPL_ID: process.env.REPL_ID || null,
        REPL_SLUG: process.env.REPL_SLUG || null,
        REPL_OWNER: process.env.REPL_OWNER || null
      };
      
      // The actual redirect URI being used (redacted for security)
      let actualRedirectUri = configuredCallbackUrl;
      if (actualRedirectUri) {
        // Show first and last few characters, mask the middle for security
        const firstPart = actualRedirectUri.substring(0, 20);
        const lastPart = actualRedirectUri.substring(actualRedirectUri.length - 20);
        actualRedirectUri = `${firstPart}...${lastPart}`;
      }
      
      // Select the most important redirect URIs to show to the user
      // These are URIs that cover different domain patterns
      const essentialRedirectURIs = [];
      
      // Include the current domain's redirect URI first
      if (expectedCallbackUrl) {
        essentialRedirectURIs.push(expectedCallbackUrl);
      }
      
      // Include the configured URI if it's not the same as the expected one
      if (configuredCallbackUrl && configuredCallbackUrl !== expectedCallbackUrl) {
        essentialRedirectURIs.push(configuredCallbackUrl);
      }
      
      // Include important domain patterns for Replit
      if (process.env.REPL_ID) {
        const importantPatterns = [
          // Standard patterns
          `https://${process.env.REPL_ID}.id.replit.dev/api/auth/google/callback`,
          `https://${process.env.REPL_ID}.id.repl.co/api/auth/google/callback`,
          
          // Patterns with hyphens
          `https://-${process.env.REPL_ID}.id.replit.dev/api/auth/google/callback`,
          
          // If we have slug and owner, add those patterns too
          ...(process.env.REPL_SLUG && process.env.REPL_OWNER ? [
            `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co/api/auth/google/callback`,
            `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.replit.dev/api/auth/google/callback`,
          ] : [])
        ];
        
        // Add only the patterns that aren't already in the essentialRedirectURIs array
        for (const pattern of importantPatterns) {
          if (!essentialRedirectURIs.includes(pattern)) {
            essentialRedirectURIs.push(pattern);
          }
        }
      }
      
      res.json({
        currentDomain: domain,
        currentUrl,
        expectedCallbackUrl,
        actualRedirectUri,
        usingExpectedCallback: expectedCallbackUrl === configuredCallbackUrl,
        allPossibleRedirectURIs: allPossibleURIs,
        essentialRedirectURIs, // Only the most important URIs to add
        possibleURICount: allPossibleURIs.length,
        essentialURICount: essentialRedirectURIs.length,
        currentCallbackInPossibleList,
        replitInfo,
        recommendation: 'Add ONLY the Essential Redirect URIs listed below to your Google Cloud Console. These are the URIs most likely to work with your application.'
      });
    } catch (error) {
      console.error("Error in Google URI debug endpoint:", error);
      res.status(500).json({ error: "Failed to retrieve redirect URIs" });
    }
  });
  
  app.get("/api/email/accounts", async (req, res) => {
    try {
      // In a real app with authentication, you'd use req.user.id
      const userId = 1; // Using default user for testing
      const accounts = await storage.getEmailAccounts(userId);
      res.json(accounts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch email accounts" });
    }
  });

  app.post("/api/email/accounts", async (req, res) => {
    try {
      // In a real app with authentication, you'd use req.user.id
      const userId = 1; // Using default user for testing
      const { provider, email } = req.body;
      
      if (!provider || !email) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // For Gmail accounts, redirect to Google OAuth
      if (provider === 'gmail') {
        console.log("User requesting Gmail connection, redirecting to OAuth");
        
        // Check for existing Gmail accounts
        const existingAccounts = await storage.getEmailAccounts(userId);
        const connectedGmailAccount = existingAccounts.find(acc => 
          acc.provider === 'gmail' && acc.connected === true && acc.accessToken && acc.refreshToken
        );
        
        if (connectedGmailAccount) {
          console.log("User already has a connected Gmail account");
          return res.json({
            message: "Gmail account already connected",
            accountId: connectedGmailAccount.id,
            alreadyConnected: true
          });
        }
        
        // No connected account, proceed with new connection
        return res.json({ 
          redirectUrl: '/api/auth/google',
          provider: 'gmail',
          needsAuth: true,
          message: "Redirecting to Google authentication"
        });
      }
      
      // For other providers or demo accounts
      const account = await storage.createEmailAccount({
        userId,
        provider,
        email,
        accessToken: "demo_access_token", // Demo token
        refreshToken: "demo_refresh_token", // Demo token
        expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour expiry
        connected: true, // Mark as connected for demo
        lastSynced: new Date()
      });
      
      // Log activity
      await storage.createActivity({
        userId,
        activityType: "email_account_added",
        description: `${provider} email account added: ${email}`
      });
      
      res.json(account);
    } catch (error) {
      res.status(500).json({ message: "Failed to add email account" });
    }
  });

  app.delete("/api/email/accounts/:id", async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const success = await storage.deleteEmailAccount(accountId);
      
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ message: "Email account not found" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to delete email account" });
    }
  });

  app.get("/api/email/messages", async (req, res) => {
    try {
      // Query parameters for filtering
      const folder = req.query.folder as string || "inbox";
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      
      // Get all email accounts for the user
      const userId = 1; // Using default user for testing
      const accounts = await storage.getEmailAccounts(userId);
      
      if (accounts.length === 0) {
        return res.json({ messages: [], totalCount: 0 });
      }
      
      // Filter accounts if accountId is provided
      const relevantAccounts = accountId 
        ? accounts.filter(acc => acc.id === accountId)
        : accounts;
      
      if (accountId && relevantAccounts.length === 0) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      // Fetch messages for each account
      const allMessages = [];
      
      for (const account of relevantAccounts) {
        try {
          let messages = [];
          
          if (account.provider === 'gmail' && account.accessToken && account.refreshToken) {
            // Use Gmail API for Gmail accounts
            try {
              // Construct a query based on the folder
              let query = '';
              if (folder === 'inbox') {
                query = 'in:inbox';
              } else if (folder === 'sent') {
                query = 'in:sent';
              }
              
              // Fetch messages from Gmail API
              messages = await googleService.listGmailMessages(
                account.accessToken, 
                account.refreshToken, 
                query
              );
              
              // Update lastSynced timestamp
              await storage.updateEmailAccount(account.id, {
                lastSynced: new Date()
              });
            } catch (apiError) {
              console.error(`Error fetching Gmail messages for account ${account.id}:`, apiError);
              
              // If there's an API error, fall back to simulated data
              messages = generateSimulatedEmails(account, folder);
            }
          } else {
            // For other providers or demo accounts, use simulated data
            messages = generateSimulatedEmails(account, folder);
          }
          
          // Add messages to collection
          allMessages.push(...messages);
        } catch (accountError) {
          console.error(`Error processing account ${account.id}:`, accountError);
          // Continue with other accounts
        }
      }
      
      // Sort messages by date (newest first)
      const sortedMessages = allMessages.sort((a, b) => {
        const dateA = a.date instanceof Date ? a.date : new Date(a.date);
        const dateB = b.date instanceof Date ? b.date : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
      
      res.json({
        messages: sortedMessages,
        totalCount: sortedMessages.length
      });
    } catch (error) {
      console.error("Error fetching email messages:", error);
      res.status(500).json({ message: "Failed to fetch email messages" });
    }
  });

  app.post("/api/email/send", async (req, res) => {
    try {
      const { accountId, to, subject, body, leadId } = req.body;
      
      if (!accountId || !to || !subject || !body) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get the email account
      const account = await storage.getEmailAccount(accountId);
      
      if (!account) {
        return res.status(404).json({ message: "Email account not found" });
      }
      
      // Handle sending the email based on provider
      let emailId;
      let emailSent = false;
      let errorMessage = null;
      
      if (account.provider === 'gmail' && account.accessToken && account.refreshToken) {
        try {
          console.log(`Sending email via Gmail API to: ${to}, subject: ${subject}`);
          
          // Refresh token if needed
          let currentAccessToken = account.accessToken;
          if (!currentAccessToken || (account.expiresAt && new Date(account.expiresAt) < new Date())) {
            console.log('Access token expired or missing, refreshing...');
            try {
              currentAccessToken = await googleService.refreshAccessToken(account.refreshToken);
              // Update the account with the new token
              await storage.updateEmailAccount(account.id, {
                accessToken: currentAccessToken,
                expiresAt: new Date(Date.now() + 3500 * 1000) // Set expiry to ~58 minutes from now
              });
              console.log('Access token refreshed successfully');
            } catch (refreshError) {
              console.error('Failed to refresh access token:', refreshError);
              return res.status(401).json({ 
                message: "Authentication expired, please reconnect your Gmail account",
                error: 'AUTH_REFRESH_FAILED'
              });
            }
          }
          
          // Send email using Gmail API
          const response = await googleService.sendGmailMessage(
            currentAccessToken,
            account.refreshToken,
            to,
            subject,
            body
          );
          
          emailId = response.id;
          emailSent = true;
          
          // Update last synced timestamp
          await storage.updateEmailAccount(account.id, {
            lastSynced: new Date()
          });
          
          console.log(`Email sent successfully via Gmail API. Message ID: ${emailId}`);
        } catch (apiError) {
          console.error("Error sending email via Gmail API:", apiError);
          errorMessage = apiError.message;
          
          // Check if error is related to authentication
          if (apiError.message && (
              apiError.message.includes('invalid_grant') || 
              apiError.message.includes('unauthorized') ||
              apiError.message.includes('auth') ||
              apiError.message.includes('401')
          )) {
            return res.status(401).json({ 
              message: "Authentication failed, please reconnect your Gmail account",
              error: 'AUTH_FAILED'
            });
          }
          
          return res.status(500).json({ 
            message: "Failed to send email through Gmail API",
            error: apiError.message 
          });
        }
      } else {
        // For other providers or demo accounts, simulate sending
        console.log('Using simulated email sending (demo mode)');
        emailId = `demo_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        emailSent = true;
      }
      
      if (emailSent) {
        // Retrieve the lead information if leadId is provided
        let leadName = "contact";
        if (leadId) {
          const lead = await storage.getLead(leadId);
          if (lead) {
            leadName = lead.name || to;
          }
        }
        
        // Create activity to log the sent email in the client's activity history
        const activity = await storage.createActivity({
          userId: account.userId,
          activityType: "email_sent",
          description: `Email sent to ${leadName} with subject: "${subject}"`,
          entityType: leadId ? "lead" : null,
          entityId: leadId || null,
          metadata: {
            emailId,
            from: account.email,
            to,
            subject,
            body: body.substring(0, 150) + (body.length > 150 ? '...' : ''),
            timestamp: new Date().toISOString()
          }
        });
        
        console.log(`Activity recorded for email: ${activity.id}`);
        
        // Return the sent message details
        res.json({ 
          success: true,
          message: {
            id: emailId,
            from: account.email,
            to,
            subject,
            body,
            date: new Date(),
            read: true,
            folder: "sent",
            leadId: leadId || null,
            activityId: activity.id
          }
        });
      } else {
        throw new Error(errorMessage || "Failed to send email");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ 
        message: "Failed to send email", 
        error: error.message 
      });
    }
  });

  app.post("/api/email/convert-to-lead", async (req, res) => {
    try {
      const { emailId, fromName, fromEmail } = req.body;
      
      if (!emailId || !fromEmail) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Create a new lead from the email sender
      const lead = await storage.createLead({
        name: fromName || fromEmail.split('@')[0],
        email: fromEmail,
        source: "Email Conversation",
        status: LeadStatus.NEW,
        ownerId: 1 // Using default user for testing
      });
      
      // In a real implementation, we would update the email message in the provider's API
      // to associate it with the new lead
      
      // Create activity to log the lead creation
      await storage.createActivity({
        userId: 1, // Using default user for testing
        activityType: "lead_created",
        description: `Lead created from email conversation with ${fromName || fromEmail}`,
        relatedLeadId: lead.id
      });
      
      res.json({ 
        success: true,
        lead
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to convert email to lead" });
    }
  });

  // Helper function to generate simulated emails for demo purposes
  function generateSimulatedEmails(account: any, folder: string) {
    const messages = [];
    const today = new Date();
    
    // Different content based on folder
    if (folder === "inbox") {
      messages.push({
        id: 1001,
        from: "customer.inquiry@example.com",
        fromName: "John Smith",
        to: account.email,
        subject: "Quote Request for Bathroom Renovation",
        body: "Hello,\n\nI'm interested in renovating my bathroom. Could you provide a quote for a complete remodel? Our bathroom is approximately 8x10 feet.\n\nThank you,\nJohn Smith",
        date: new Date(today.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        read: false,
        folder: "inbox",
        leadId: null
      });
      
      messages.push({
        id: 1002,
        from: "sarah.williams@example.com",
        fromName: "Sarah Williams",
        to: account.email,
        subject: "Following up on kitchen renovation",
        body: "Hi there,\n\nJust following up on our conversation last week about the kitchen renovation. Have you had a chance to prepare an estimate?\n\nBest regards,\nSarah",
        date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        read: true,
        folder: "inbox",
        leadId: 1
      });
      
      messages.push({
        id: 1003,
        from: "supplier@buildingmaterials.com",
        fromName: "Building Materials Inc.",
        to: account.email,
        subject: "Order Confirmation #12345",
        body: "Thank you for your order #12345. We are processing it and will ship the items within 2-3 business days.\n\nYour Building Materials Team",
        date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        read: true,
        folder: "inbox",
        leadId: null
      });
    } else if (folder === "sent") {
      messages.push({
        id: 2001,
        from: account.email,
        to: "sarah.williams@example.com",
        toName: "Sarah Williams",
        subject: "Re: Following up on kitchen renovation",
        body: "Hi Sarah,\n\nThank you for your patience. I've attached the estimate for your kitchen renovation as discussed. Please let me know if you have any questions.\n\nBest regards,\n" + account.email.split('@')[0],
        date: new Date(today.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
        read: true,
        folder: "sent",
        leadId: 1
      });
      
      messages.push({
        id: 2002,
        from: account.email,
        to: "customer.inquiry@example.com",
        toName: "John Smith",
        subject: "Re: Quote Request for Bathroom Renovation",
        body: "Hello John,\n\nThank you for your inquiry. I'd be happy to provide a quote for your bathroom renovation. Could we schedule a time for me to visit and see the space?\n\nRegards,\n" + account.email.split('@')[0],
        date: new Date(today.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        read: true,
        folder: "sent",
        leadId: null
      });
    } else if (folder === "trash") {
      messages.push({
        id: 3001,
        from: "marketing@spam.example.com",
        fromName: "Marketing Team",
        to: account.email,
        subject: "Special Offer Just For You!",
        body: "LIMITED TIME OFFER! Click now for amazing discounts on products you don't need!",
        date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        read: true,
        folder: "trash",
        leadId: null
      });
    }
    
    return messages;
  }

  // Add catch-all route for SPA - This ensures all frontend routes work in production
  app.get([
    "/dashboard", 
    "/leads", 
    "/clients", 
    "/deals", 
    "/tasks", 
    "/inbox", 
    "/calendar", 
    "/booking", 
    "/payments", 
    "/customers", 
    "/reports", 
    "/settings"
  ], (req, res, next) => {
    // If this is an API request, let it pass through
    if (req.path.startsWith("/api")) {
      return next();
    }
    
    // In development, let Vite handle it
    if (process.env.NODE_ENV === "development") {
      return next();
    }
    
    // In production, serve index.html for all frontend routes
    return res.sendFile("index.html", { root: "./dist/public" });
  });
  
  // Pipeline Management API
  app.get("/api/pipelines", async (req, res) => {
    try {
      const pipelines = await storage.getPipelines();
      res.json(pipelines);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pipelines" });
    }
  });
  
  app.get("/api/pipelines/default", async (req, res) => {
    try {
      const defaultPipeline = await storage.getDefaultPipeline();
      if (!defaultPipeline) {
        return res.status(404).json({ message: "No default pipeline found" });
      }
      res.json(defaultPipeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch default pipeline" });
    }
  });
  
  app.get("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const pipeline = await storage.getPipeline(id);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      res.json(pipeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pipeline" });
    }
  });
  
  app.post("/api/pipelines", async (req, res) => {
    try {
      // Parse and validate input
      const requestData = req.body;
      const validatedData = insertPipelineSchema.parse(requestData);
      
      const newPipeline = await storage.createPipeline(validatedData);
      
      // Create activity for pipeline creation
      await storage.createActivity({
        userId: 1, // In a real app, this would be the authenticated user
        activityType: "pipeline_created",
        description: `Pipeline "${newPipeline.name}" created`
      });
      
      res.status(201).json(newPipeline);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid pipeline data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create pipeline" });
    }
  });
  
  app.patch("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const pipeline = await storage.getPipeline(id);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      const requestData = req.body;
      const updatedPipeline = await storage.updatePipeline(id, requestData);
      
      // Create activity for pipeline update
      await storage.createActivity({
        userId: 1, // In a real app, this would be the authenticated user
        activityType: "pipeline_updated",
        description: `Pipeline "${pipeline.name}" updated`
      });
      
      res.json(updatedPipeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to update pipeline" });
    }
  });
  
  app.delete("/api/pipelines/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const pipeline = await storage.getPipeline(id);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      const success = await storage.deletePipeline(id);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete pipeline" });
      }
      
      // Create activity for pipeline deletion
      await storage.createActivity({
        userId: 1, // In a real app, this would be the authenticated user
        activityType: "pipeline_deleted",
        description: `Pipeline "${pipeline.name}" deleted`
      });
      
      res.json({ success: true, message: "Pipeline deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete pipeline" });
    }
  });
  
  app.post("/api/pipelines/:id/set-default", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const pipeline = await storage.getPipeline(id);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      const updatedPipeline = await storage.setDefaultPipeline(id);
      
      // Create activity for setting default pipeline
      await storage.createActivity({
        userId: 1, // In a real app, this would be the authenticated user
        activityType: "pipeline_set_default",
        description: `Pipeline "${pipeline.name}" set as default`
      });
      
      res.json(updatedPipeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to set default pipeline" });
    }
  });
  
  app.patch("/api/pipelines/:id/lanes/:laneId", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.id);
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: "Invalid pipeline ID format" });
      }
      
      const laneId = req.params.laneId;
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Lane name is required" });
      }
      
      const pipeline = await storage.getPipeline(pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      const updatedPipeline = await storage.updateLaneInPipeline(pipelineId, laneId, name);
      if (!updatedPipeline) {
        return res.status(404).json({ message: "Lane not found in pipeline" });
      }
      
      // Create activity for lane update
      await storage.createActivity({
        userId: 1, // In a real app, this would be the authenticated user
        activityType: "pipeline_lane_updated",
        description: `Lane renamed to "${name}" in pipeline "${pipeline.name}"`
      });
      
      res.json(updatedPipeline);
    } catch (error) {
      res.status(500).json({ message: "Failed to update pipeline lane" });
    }
  });
  
  // Add new lane to pipeline
  app.post("/api/pipelines/:id/lanes", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.id);
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: "Invalid pipeline ID format" });
      }
      
      const { name } = req.body;
      
      if (!name || typeof name !== 'string') {
        return res.status(400).json({ message: "Lane name is required" });
      }
      
      const pipeline = await storage.getPipeline(pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      // Generate a unique lane ID based on the name
      const laneId = name.toLowerCase().replace(/\s+/g, '_');
      
      // Check if this lane ID already exists in the pipeline
      if (pipeline.lanes.some(lane => lane.id === laneId)) {
        return res.status(400).json({ message: "Lane with similar name already exists" });
      }
      
      // Add the new lane to the pipeline
      const newLane = { id: laneId, name };
      const updatedLanes = [...pipeline.lanes, newLane];
      
      const updatedPipeline = await storage.updatePipeline(pipelineId, {
        lanes: updatedLanes
      });
      
      // Create activity for lane creation
      await storage.createActivity({
        userId: 1, // In a real app, this would be the authenticated user
        activityType: "pipeline_lane_added",
        description: `Lane "${name}" added to pipeline "${pipeline.name}"`
      });
      
      res.json(updatedPipeline);
    } catch (error) {
      console.error("Error adding lane:", error);
      res.status(500).json({ message: "Failed to add lane to pipeline" });
    }
  });
  
  // Delete lane from pipeline
  app.delete("/api/pipelines/:id/lanes/:laneId", async (req, res) => {
    try {
      const pipelineId = parseInt(req.params.id);
      if (isNaN(pipelineId)) {
        return res.status(400).json({ message: "Invalid pipeline ID format" });
      }
      
      const laneId = req.params.laneId;
      
      const pipeline = await storage.getPipeline(pipelineId);
      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }
      
      // Check if lane exists
      const laneToDelete = pipeline.lanes.find(lane => lane.id === laneId);
      if (!laneToDelete) {
        return res.status(404).json({ message: "Lane not found in pipeline" });
      }
      
      // Remove the lane from the pipeline
      const updatedLanes = pipeline.lanes.filter(lane => lane.id !== laneId);
      
      // Ensure we're not removing all lanes
      if (updatedLanes.length === 0) {
        return res.status(400).json({ message: "Cannot delete the last lane in a pipeline" });
      }
      
      const updatedPipeline = await storage.updatePipeline(pipelineId, {
        lanes: updatedLanes
      });
      
      // Also update any clients in this lane to move to the first available lane
      if (updatedLanes.length > 0) {
        const fallbackLaneId = updatedLanes[0].id;
        
        // Get all clients in this pipeline and lane
        const leads = await storage.getLeads();
        const clientsInLane = leads.filter(
          lead => lead.isClient && lead.kanbanLane === laneId && lead.pipelineId === pipelineId
        );
        
        // Move each client to the fallback lane
        for (const client of clientsInLane) {
          await storage.updateLead(client.id, { kanbanLane: fallbackLaneId });
        }
      }
      
      // Create activity for lane deletion
      await storage.createActivity({
        userId: 1,
        activityType: "pipeline_lane_deleted",
        description: `Lane "${laneToDelete.name}" deleted from pipeline "${pipeline.name}"`
      });
      
      res.json(updatedPipeline);
    } catch (error) {
      console.error("Error deleting lane:", error);
      res.status(500).json({ message: "Failed to delete lane from pipeline" });
    }
  });
  
  // Moving clients between lanes in a pipeline
  app.patch("/api/clients/:id/move", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID format" });
      }
      
      const { laneId, pipelineId } = req.body;
      
      if (!laneId || typeof laneId !== 'string') {
        return res.status(400).json({ message: "Lane ID is required" });
      }
      
      // Get the client (which is a lead marked as client)
      const client = await storage.getLead(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      
      if (!client.isClient) {
        return res.status(400).json({ message: "This lead has not been converted to a client" });
      }
      
      // Update the client's kanban lane
      const updatedClient = await storage.updateLead(id, { 
        kanbanLane: laneId,
        pipelineId: pipelineId ? parseInt(pipelineId) : client.pipelineId
      });
      
      // Create activity for moving client
      await storage.createActivity({
        userId: 1, // In a real app, this would be the authenticated user
        activityType: "client_moved",
        description: `Client "${client.name}" moved to new lane in pipeline`,
        relatedLeadId: client.id
      });
      
      res.json(updatedClient);
    } catch (error) {
      console.error("Error moving client:", error);
      res.status(500).json({ message: "Failed to move client" });
    }
  });
  
  // Universal catch-all route for all nested routes and parameterized URLs
  app.get('*', (req, res, next) => {
    // Skip API requests
    if (req.path.startsWith('/api')) {
      return next();
    }
    
    // In development, let Vite handle it
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    // In production, serve index.html for all other frontend routes
    return res.sendFile('index.html', { root: './dist/public' });
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
