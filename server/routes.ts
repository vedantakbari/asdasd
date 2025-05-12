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
  LeadStatus,
} from "@shared/schema";
import { createPaymentIntent, isStripeConfigured } from "./stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  const apiRouter = app.route("/api");

  // Leads API
  app.get("/api/leads", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      res.json(leads);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leads" });
    }
  });
  
  // Get clients (leads with isClient=true)
  app.get("/api/leads/clients", async (req, res) => {
    try {
      const leads = await storage.getLeads();
      const clients = leads.filter(lead => lead.isClient === true);
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch clients" });
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
      const validatedData = insertLeadSchema.parse(req.body);
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

      const validatedData = insertLeadSchema.partial().parse(req.body);
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
      const validatedData = insertDealSchema.parse(req.body);
      
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

      const validatedData = insertDealSchema.partial().parse(req.body);
      
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}
