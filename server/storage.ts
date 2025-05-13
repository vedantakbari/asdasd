import { 
  users, type User, type UpsertUser,
  leads, type Lead, type InsertLead,
  deals, type Deal, type InsertDeal,
  customers, type Customer, type InsertCustomer,
  tasks, type Task, type InsertTask,
  appointments, type Appointment, type InsertAppointment,
  payments, type Payment, type InsertPayment,
  activities, type Activity, type InsertActivity,
  googleCalendarSettings, type GoogleCalendarSettings, type InsertGoogleCalendarSettings,
  emailAccounts, type EmailAccount, type InsertEmailAccount,
  pipelines, type Pipeline, type InsertPipeline,
  LeadStatus, DealStage, TaskPriority, TaskStatus, KanbanLane
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  upsertUser(userData: UpsertUser): Promise<User>;
  
  // Google Calendar Integration
  getGoogleCalendarSettings(userId: number): Promise<GoogleCalendarSettings | undefined>;
  createGoogleCalendarSettings(settings: InsertGoogleCalendarSettings): Promise<GoogleCalendarSettings>;
  updateGoogleCalendarSettings(userId: number, settings: Partial<InsertGoogleCalendarSettings>): Promise<GoogleCalendarSettings | undefined>;
  
  // Email Integration
  getEmailAccounts(userId: number): Promise<EmailAccount[]>;
  getEmailAccount(id: number): Promise<EmailAccount | undefined>;
  createEmailAccount(account: InsertEmailAccount): Promise<EmailAccount>;
  updateEmailAccount(id: number, account: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined>;
  deleteEmailAccount(id: number): Promise<boolean>;
  
  // Leads
  getLeads(): Promise<Lead[]>;
  getLead(id: number): Promise<Lead | undefined>;
  createLead(lead: InsertLead): Promise<Lead>;
  updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined>;
  deleteLead(id: number): Promise<boolean>;
  getLeadsByStatus(status: string): Promise<Lead[]>;
  
  // Deals
  getDeals(): Promise<Deal[]>;
  getDeal(id: number): Promise<Deal | undefined>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined>;
  deleteDeal(id: number): Promise<boolean>;
  getDealsByStage(stage: string): Promise<Deal[]>;
  getDealsByCustomer(customerId: number): Promise<Deal[]>;
  
  // Customers
  getCustomers(): Promise<Customer[]>;
  getCustomer(id: number): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: number): Promise<boolean>;
  
  // Tasks
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTasksByAssignee(assigneeId: number): Promise<Task[]>;
  getTasksDueToday(): Promise<Task[]>;
  
  // Appointments
  getAppointments(): Promise<Appointment[]>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  getAppointmentsForToday(): Promise<Appointment[]>;
  getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]>;
  
  // Payments
  getPayments(): Promise<Payment[]>;
  getPayment(id: number): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  getPaymentsByDeal(dealId: number): Promise<Payment[]>;
  getPaymentsByCustomer(customerId: number): Promise<Payment[]>;
  
  // Activities
  getActivities(): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getRecentActivities(limit: number): Promise<Activity[]>;
  
  // Pipelines
  getPipelines(): Promise<Pipeline[]>;
  getPipeline(id: number): Promise<Pipeline | undefined>;
  getDefaultPipeline(): Promise<Pipeline | undefined>;
  createPipeline(pipeline: InsertPipeline): Promise<Pipeline>;
  updatePipeline(id: number, pipeline: Partial<InsertPipeline>): Promise<Pipeline | undefined>;
  deletePipeline(id: number): Promise<boolean>;
  setDefaultPipeline(id: number): Promise<Pipeline | undefined>;
  updateLaneInPipeline(pipelineId: number, laneId: string, newName: string): Promise<Pipeline | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private leads: Map<number, Lead>;
  private deals: Map<number, Deal>;
  private customers: Map<number, Customer>;
  private tasks: Map<number, Task>;
  private appointments: Map<number, Appointment>;
  private payments: Map<number, Payment>;
  private activities: Map<number, Activity>;
  private googleCalendarSettings: Map<number, GoogleCalendarSettings>;
  private emailAccounts: Map<number, EmailAccount>;
  private pipelines: Map<number, Pipeline>;
  
  private userId: number;
  private leadId: number;
  private dealId: number;
  private customerId: number;
  private taskId: number;
  private appointmentId: number;
  private paymentId: number;
  private activityId: number;
  private googleCalendarSettingsId: number;
  private emailAccountId: number;
  private pipelineId: number;

  constructor() {
    this.users = new Map();
    this.leads = new Map();
    this.deals = new Map();
    this.customers = new Map();
    this.tasks = new Map();
    this.appointments = new Map();
    this.payments = new Map();
    this.activities = new Map();
    this.googleCalendarSettings = new Map();
    this.emailAccounts = new Map();
    this.pipelines = new Map();
    
    this.userId = 1;
    this.leadId = 1;
    this.dealId = 1;
    this.customerId = 1;
    this.taskId = 1;
    this.appointmentId = 1;
    this.paymentId = 1;
    this.activityId = 1;
    this.googleCalendarSettingsId = 1;
    this.emailAccountId = 1;
    this.pipelineId = 1;
    
    // Add some sample data for testing
    this.seedSampleData();
  }

  // Users
  async getUser(id: string | number): Promise<User | undefined> {
    if (typeof id === 'string') {
      // For string IDs (from Replit Auth), check each user
      for (const user of this.users.values()) {
        if (user.id.toString() === id) {
          return user;
        }
      }
      return undefined;
    }
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  // Add upsertUser method for Replit Auth
  async upsertUser(userData: UpsertUser): Promise<User> {
    // For now, we'll create a new user in memory storage
    // In an actual database implementation, we'd use an upsert operation
    const id = this.userId++;
    const now = new Date();
    const user: User = {
      ...userData,
      id,
      createdAt: now,
      updatedAt: now
    };
    this.users.set(id, user);
    return user;
  }

  // Leads
  async getLeads(): Promise<Lead[]> {
    return Array.from(this.leads.values());
  }

  async getLead(id: number): Promise<Lead | undefined> {
    return this.leads.get(id);
  }

  async createLead(insertLead: InsertLead): Promise<Lead> {
    const id = this.leadId++;
    const now = new Date();
    // Set default values for important fields
    const lead: Lead = { 
      ...insertLead, 
      id, 
      createdAt: now, 
      updatedAt: now,
      isClient: insertLead.isClient || false, // Ensure isClient is explicitly set
      kanbanLane: insertLead.kanbanLane || KanbanLane.NEW_CLIENT // Set default lane
    };
    this.leads.set(id, lead);
    return lead;
  }

  async updateLead(id: number, lead: Partial<InsertLead>): Promise<Lead | undefined> {
    const existingLead = this.leads.get(id);
    if (!existingLead) return undefined;
    
    const updatedLead: Lead = { 
      ...existingLead, 
      ...lead, 
      updatedAt: new Date() 
    };
    this.leads.set(id, updatedLead);
    return updatedLead;
  }

  async deleteLead(id: number): Promise<boolean> {
    return this.leads.delete(id);
  }

  async getLeadsByStatus(status: string): Promise<Lead[]> {
    return Array.from(this.leads.values()).filter(lead => lead.status === status);
  }

  // Deals
  async getDeals(): Promise<Deal[]> {
    return Array.from(this.deals.values());
  }

  async getDeal(id: number): Promise<Deal | undefined> {
    return this.deals.get(id);
  }

  async createDeal(insertDeal: InsertDeal): Promise<Deal> {
    const id = this.dealId++;
    const now = new Date();
    const deal: Deal = { 
      ...insertDeal, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.deals.set(id, deal);
    return deal;
  }

  async updateDeal(id: number, deal: Partial<InsertDeal>): Promise<Deal | undefined> {
    const existingDeal = this.deals.get(id);
    if (!existingDeal) return undefined;
    
    const updatedDeal: Deal = { 
      ...existingDeal, 
      ...deal, 
      updatedAt: new Date() 
    };
    this.deals.set(id, updatedDeal);
    return updatedDeal;
  }

  async deleteDeal(id: number): Promise<boolean> {
    return this.deals.delete(id);
  }

  async getDealsByStage(stage: string): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.stage === stage);
  }

  async getDealsByCustomer(customerId: number): Promise<Deal[]> {
    return Array.from(this.deals.values()).filter(deal => deal.customerId === customerId);
  }

  // Customers
  async getCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  async getCustomer(id: number): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = this.customerId++;
    const now = new Date();
    const customer: Customer = { 
      ...insertCustomer, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const existingCustomer = this.customers.get(id);
    if (!existingCustomer) return undefined;
    
    const updatedCustomer: Customer = { 
      ...existingCustomer, 
      ...customer, 
      updatedAt: new Date() 
    };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: number): Promise<boolean> {
    return this.customers.delete(id);
  }

  // Tasks
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const now = new Date();
    const task: Task = { 
      ...insertTask, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask: Task = { 
      ...existingTask, 
      ...task, 
      updatedAt: new Date() 
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.status === status);
  }

  async getTasksByAssignee(assigneeId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.assigneeId === assigneeId);
  }

  async getTasksDueToday(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return Array.from(this.tasks.values()).filter(task => {
      if (!task.dueDate) return false;
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate < tomorrow;
    });
  }

  // Appointments
  async getAppointments(): Promise<Appointment[]> {
    return Array.from(this.appointments.values());
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    return this.appointments.get(id);
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const id = this.appointmentId++;
    const now = new Date();
    const appointment: Appointment = { 
      ...insertAppointment, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.appointments.set(id, appointment);
    return appointment;
  }

  async updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const existingAppointment = this.appointments.get(id);
    if (!existingAppointment) return undefined;
    
    const updatedAppointment: Appointment = { 
      ...existingAppointment, 
      ...appointment, 
      updatedAt: new Date() 
    };
    this.appointments.set(id, updatedAppointment);
    return updatedAppointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    return this.appointments.delete(id);
  }

  async getAppointmentsForToday(): Promise<Appointment[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return Array.from(this.appointments.values()).filter(appointment => {
      const startTime = new Date(appointment.startTime);
      return startTime >= today && startTime < tomorrow;
    });
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<Appointment[]> {
    return Array.from(this.appointments.values()).filter(appointment => {
      const appointmentDate = new Date(appointment.startTime);
      return appointmentDate >= startDate && appointmentDate <= endDate;
    });
  }

  // Payments
  async getPayments(): Promise<Payment[]> {
    return Array.from(this.payments.values());
  }

  async getPayment(id: number): Promise<Payment | undefined> {
    return this.payments.get(id);
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = this.paymentId++;
    const now = new Date();
    const payment: Payment = { 
      ...insertPayment, 
      id, 
      createdAt: now 
    };
    this.payments.set(id, payment);
    return payment;
  }

  async getPaymentsByDeal(dealId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.dealId === dealId);
  }

  async getPaymentsByCustomer(customerId: number): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(payment => payment.customerId === customerId);
  }

  // Activities
  async getActivities(): Promise<Activity[]> {
    return Array.from(this.activities.values());
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.activityId++;
    const now = new Date();
    const activity: Activity = { 
      ...insertActivity, 
      id, 
      createdAt: now 
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getRecentActivities(limit: number): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
  
  // Google Calendar Integration Methods
  async getGoogleCalendarSettings(userId: number): Promise<GoogleCalendarSettings | undefined> {
    for (const settings of this.googleCalendarSettings.values()) {
      if (settings.userId === userId) {
        return settings;
      }
    }
    return undefined;
  }

  async createGoogleCalendarSettings(settings: InsertGoogleCalendarSettings): Promise<GoogleCalendarSettings> {
    const id = this.googleCalendarSettingsId++;
    const now = new Date();
    
    const newSettings: GoogleCalendarSettings = {
      id,
      ...settings,
      createdAt: now,
      updatedAt: now
    };
    
    this.googleCalendarSettings.set(id, newSettings);
    
    // Create activity for the new settings
    await this.createActivity({
      userId: settings.userId,
      activityType: "google_calendar_connected",
      description: "Connected Google Calendar",
    });
    
    return newSettings;
  }
  
  async updateGoogleCalendarSettings(userId: number, updatedSettings: Partial<InsertGoogleCalendarSettings>): Promise<GoogleCalendarSettings | undefined> {
    const settings = await this.getGoogleCalendarSettings(userId);
    
    if (settings) {
      const updated = { 
        ...settings, 
        ...updatedSettings,
        updatedAt: new Date()
      };
      
      this.googleCalendarSettings.set(settings.id, updated);
      
      // Create activity for updated settings
      await this.createActivity({
        userId: userId,
        activityType: "google_calendar_updated",
        description: "Updated Google Calendar settings",
      });
      
      return updated;
    }
    
    return undefined;
  }
  
  // Email Account Methods
  async getEmailAccounts(userId: number): Promise<EmailAccount[]> {
    const accounts: EmailAccount[] = [];
    
    for (const account of this.emailAccounts.values()) {
      if (account.userId === userId) {
        accounts.push(account);
      }
    }
    
    return accounts;
  }
  
  async getEmailAccount(id: number): Promise<EmailAccount | undefined> {
    return this.emailAccounts.get(id);
  }
  
  async createEmailAccount(accountData: InsertEmailAccount): Promise<EmailAccount> {
    const id = this.emailAccountId++;
    
    const account: EmailAccount = {
      id,
      ...accountData,
      connected: accountData.connected ?? false,
      lastSynced: accountData.lastSynced || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.emailAccounts.set(id, account);
    
    // Create an activity for the account connection
    await this.createActivity({
      userId: accountData.userId,
      activityType: "email_account_added",
      description: `Email account ${accountData.email} (${accountData.provider}) was connected`,
    });
    
    return account;
  }
  
  async updateEmailAccount(id: number, accountData: Partial<InsertEmailAccount>): Promise<EmailAccount | undefined> {
    const account = await this.getEmailAccount(id);
    
    if (!account) {
      return undefined;
    }
    
    const updatedAccount = {
      ...account,
      ...accountData,
      updatedAt: new Date(),
    };
    
    this.emailAccounts.set(id, updatedAccount);
    
    return updatedAccount;
  }
  
  async deleteEmailAccount(id: number): Promise<boolean> {
    const account = await this.getEmailAccount(id);
    
    if (!account) {
      return false;
    }
    
    // Create an activity for the account removal
    await this.createActivity({
      userId: account.userId,
      activityType: "email_account_removed",
      description: `Email account ${account.email} (${account.provider}) was disconnected`,
    });
    
    return this.emailAccounts.delete(id);
  }

  // Helper method to seed sample data for testing
  private seedSampleData() {
    // Create admin user
    const admin: InsertUser = {
      username: "admin",
      password: "password",
      fullName: "Michael Scott",
      email: "michael@example.com",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      role: "admin"
    };
    this.createUser(admin);

    // Create some customers
    const customers: InsertCustomer[] = [
      {
        name: "Richard Taylor",
        email: "richard.taylor@example.com",
        phone: "555-123-4567",
        address: "123 Main St, Anytown, CA 12345",
        company: "Taylor Industries"
      },
      {
        name: "Jennifer Wilson",
        email: "jennifer.wilson@example.com",
        phone: "555-234-5678",
        address: "456 Oak Ave, Sometown, CA 67890",
        company: "Wilson Tech"
      },
      {
        name: "Robert Miller",
        email: "robert.miller@example.com",
        phone: "555-987-6543",
        address: "789 Pine Rd, Othertown, CA 54321",
        company: "Miller Associates"
      },
      {
        name: "Michael & Lisa Davis",
        email: "davis.family@example.com",
        phone: "555-876-5432",
        address: "321 Elm Ln, Lasttown, CA 98765",
        company: ""
      }
    ];
    
    customers.forEach(customer => this.createCustomer(customer));

    // Create some leads
    const leads: InsertLead[] = [
      {
        name: "Emma Rodriguez",
        email: "emma.rodriguez@example.com",
        phone: "555-123-4567",
        address: "123 Pine St, Sometown, CA 45678",
        status: LeadStatus.NEW,
        source: "Website Form",
        value: 15000,
        notes: "Interested in kitchen renovation",
        nextActivity: "Follow-up call",
        nextActivityDate: new Date(Date.now() + 86400000) // tomorrow
      },
      {
        name: "David Martinez",
        email: "david.martinez@example.com",
        phone: "555-987-6543",
        address: "456 Oak Ave, Othertown, CA 56789",
        status: LeadStatus.NEW,
        source: "Referral",
        value: 5000,
        notes: "Needs roof inspection",
        nextActivity: "Schedule inspection",
        nextActivityDate: new Date(Date.now() + 172800000) // 2 days later
      },
      {
        name: "Thomas Wilson",
        email: "thomas.wilson@example.com",
        phone: "555-765-4321",
        address: "789 Maple Dr, Anytown, CA 23456",
        status: LeadStatus.CONTACTED,
        source: "Google Ads",
        value: 12000,
        notes: "Interested in bathroom remodel",
        nextActivity: "Send proposal",
        nextActivityDate: new Date(Date.now() + 86400000) // tomorrow
      },
      {
        name: "Patricia Garcia",
        email: "patricia.garcia@example.com",
        phone: "555-234-5678",
        address: "321 Cedar Ln, Lasttown, CA 34567",
        status: LeadStatus.CONTACTED,
        source: "Home Show",
        value: 7200,
        notes: "Needs window installation",
        nextActivity: "Schedule consultation",
        nextActivityDate: new Date(Date.now() + 259200000) // 3 days later
      },
      {
        name: "James Anderson",
        email: "james.anderson@example.com",
        phone: "555-876-5432",
        address: "654 Birch Ct, Midtown, CA 45678",
        status: LeadStatus.QUALIFIED,
        source: "Facebook Ad",
        value: 9500,
        notes: "Wants deck construction",
        nextActivity: "Prepare estimate",
        nextActivityDate: new Date(Date.now() + 86400000) // tomorrow
      },
      {
        name: "Susan Lee",
        email: "susan.lee@example.com",
        phone: "555-345-6789",
        address: "987 Walnut Ave, Hightown, CA 56789",
        status: LeadStatus.PROPOSAL,
        source: "Website Form",
        value: 42500,
        notes: "Full home renovation project",
        nextActivity: "Follow up on proposal",
        nextActivityDate: new Date(Date.now() + 172800000) // 2 days later
      }
    ];
    
    leads.forEach(lead => this.createLead(lead));

    // Create some deals
    const deals: InsertDeal[] = [
      {
        title: "Kitchen Remodel",
        value: 28750,
        stage: DealStage.IN_PROGRESS,
        customerId: 1, // Richard Taylor
        description: "Complete kitchen renovation including new cabinets, countertops, and appliances",
        startDate: new Date(Date.now() - 604800000), // 1 week ago
        endDate: new Date(Date.now() + 2592000000) // 30 days later
      },
      {
        title: "HVAC Installation",
        value: 12450,
        stage: DealStage.INSTALLATION,
        customerId: 2, // Jennifer Wilson
        description: "Installation of new HVAC system",
        startDate: new Date(Date.now() - 1209600000), // 2 weeks ago
        endDate: new Date(Date.now() + 432000000) // 5 days later
      },
      {
        title: "Plumbing Repair",
        value: 850,
        stage: DealStage.REVIEW,
        customerId: 3, // Robert Miller
        description: "Repair of leaking pipes and fixture replacement",
        startDate: new Date(Date.now() - 345600000), // 4 days ago
        endDate: new Date(Date.now() + 86400000) // 1 day later
      },
      {
        title: "Window Installation",
        value: 7200,
        stage: DealStage.PLANNING,
        customerId: 4, // Michael & Lisa Davis
        description: "Installation of 8 new energy-efficient windows",
        startDate: new Date(), // today
        endDate: new Date(Date.now() + 1209600000) // 14 days later
      }
    ];
    
    deals.forEach(deal => this.createDeal(deal));

    // Create some tasks
    const tasks: InsertTask[] = [
      {
        title: "Follow up with Emily Johnson about cabinet project",
        description: "Call to discuss cabinet options and pricing",
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        dueDate: new Date(), // today
        assigneeId: 1
      },
      {
        title: "Prepare quote for Stevenson bathroom remodel",
        description: "Create detailed quote with material and labor costs",
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        assigneeId: 1
      },
      {
        title: "Order materials for Garcia project",
        description: "Order cabinets, countertops, and fixtures",
        priority: TaskPriority.MEDIUM,
        status: TaskStatus.TODO,
        dueDate: new Date(Date.now() + 172800000), // 2 days later
        assigneeId: 1
      },
      {
        title: "Call supplier about backordered items",
        description: "Check status of backordered fixtures",
        priority: TaskPriority.LOW,
        status: TaskStatus.COMPLETED,
        dueDate: new Date(Date.now() - 86400000), // yesterday
        assigneeId: 1
      }
    ];
    
    tasks.forEach(task => this.createTask(task));

    // Create some appointments
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const appointments: InsertAppointment[] = [
      {
        title: "Kitchen Remodel Consultation",
        startTime: new Date(today.getTime() + 9 * 3600000), // 9:00 AM
        endTime: new Date(today.getTime() + 10.5 * 3600000), // 10:30 AM
        location: "123 Main St, Anytown, CA 12345",
        description: "Initial consultation for kitchen remodel",
        customerId: 1, // Richard Taylor
        dealId: 1
      },
      {
        title: "Plumbing Repair Service",
        startTime: new Date(today.getTime() + 11.5 * 3600000), // 11:30 AM
        endTime: new Date(today.getTime() + 12.5 * 3600000), // 12:30 PM
        location: "789 Pine Rd, Othertown, CA 54321",
        description: "Fix leaking pipes under sink",
        customerId: 3, // Robert Miller
        dealId: 3
      },
      {
        title: "HVAC Maintenance",
        startTime: new Date(today.getTime() + 14 * 3600000), // 2:00 PM
        endTime: new Date(today.getTime() + 15 * 3600000), // 3:00 PM
        location: "456 Oak Ave, Sometown, CA 67890",
        description: "Regular maintenance of HVAC system",
        customerId: 2, // Jennifer Wilson
        dealId: 2
      },
      {
        title: "Window Installation Quote",
        startTime: new Date(today.getTime() + 16.5 * 3600000), // 4:30 PM
        endTime: new Date(today.getTime() + 17.5 * 3600000), // 5:30 PM
        location: "321 Elm Ln, Lasttown, CA 98765",
        description: "Measure windows and provide quote",
        customerId: 4, // Michael & Lisa Davis
        dealId: 4
      }
    ];
    
    appointments.forEach(appointment => this.createAppointment(appointment));

    // Create some payments
    const payments: InsertPayment[] = [
      {
        amount: 14375,
        method: "Credit Card",
        status: "paid",
        dealId: 1,
        customerId: 1,
        description: "50% deposit for kitchen remodel"
      },
      {
        amount: 6225,
        method: "Bank Transfer",
        status: "paid",
        dealId: 2,
        customerId: 2,
        description: "50% deposit for HVAC installation"
      },
      {
        amount: 850,
        method: "Credit Card",
        status: "paid",
        dealId: 3,
        customerId: 3,
        description: "Full payment for plumbing repair"
      }
    ];
    
    payments.forEach(payment => this.createPayment(payment));

    // Create some activities
    const activities: InsertActivity[] = [
      {
        userId: 1,
        activityType: "lead_created",
        description: "New lead created - Emma Rodriguez",
        relatedLeadId: 1
      },
      {
        userId: 1,
        activityType: "call_completed",
        description: "Call completed with Thomas Wilson",
        relatedLeadId: 3
      },
      {
        userId: 1,
        activityType: "deal_won",
        description: "Deal won - Richard Taylor ($28,750)",
        relatedDealId: 1
      },
      {
        userId: 1,
        activityType: "proposal_sent",
        description: "Proposal sent to Susan Lee",
        relatedLeadId: 6
      },
      {
        userId: 1,
        activityType: "appointment_scheduled",
        description: "Appointment scheduled with James Anderson",
        relatedLeadId: 5
      }
    ];
    
    activities.forEach(activity => this.createActivity(activity));
    
    // Sample email accounts
    const emailAccounts: InsertEmailAccount[] = [
      {
        userId: 1,
        provider: "gmail",
        email: "Connect Your Gmail Account",
        accessToken: null,
        refreshToken: null,
        connected: false,
        providerUserId: null,
        settings: {
          syncFrequency: "15min",
          autoRespond: false,
          signature: "Your Signature\nYour Company"
        }
      }
    ];

    emailAccounts.forEach(account => this.createEmailAccount(account));
    
    // Sample pipelines with real estate workflow lanes
    const defaultPipeline: InsertPipeline = {
      name: "Real Estate Listing Workflow",
      description: "Default workflow for real estate listings",
      isDefault: true,
      lanes: [
        { id: KanbanLane.PRESENT_VALUATION, name: "Present valuation report" },
        { id: KanbanLane.SIGN_AGREEMENTS, name: "Sign listing agreements and disclosures" },
        { id: KanbanLane.KICKOFF_MEETINGS, name: "Seller kickoff meetings" },
        { id: KanbanLane.CREATE_MARKETING, name: "Create marketing materials" },
        { id: KanbanLane.LAUNCH_MARKETING, name: "Launch marketing" },
      ]
    };
    
    this.createPipeline(defaultPipeline);
  }
  
  // Pipeline methods
  async getPipelines(): Promise<Pipeline[]> {
    return Array.from(this.pipelines.values());
  }
  
  async getPipeline(id: number): Promise<Pipeline | undefined> {
    return this.pipelines.get(id);
  }
  
  async getDefaultPipeline(): Promise<Pipeline | undefined> {
    for (const pipeline of this.pipelines.values()) {
      if (pipeline.isDefault) {
        return pipeline;
      }
    }
    return undefined;
  }
  
  async createPipeline(pipeline: InsertPipeline): Promise<Pipeline> {
    const now = new Date();
    const newPipeline: Pipeline = {
      id: this.pipelineId++,
      name: pipeline.name,
      description: pipeline.description || null,
      isDefault: pipeline.isDefault || false,
      lanes: pipeline.lanes || [],
      createdAt: now,
      updatedAt: now
    };
    
    this.pipelines.set(newPipeline.id, newPipeline);
    return newPipeline;
  }
  
  async updatePipeline(id: number, data: Partial<InsertPipeline>): Promise<Pipeline | undefined> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return undefined;
    
    const updatedPipeline: Pipeline = {
      ...pipeline,
      name: data.name !== undefined ? data.name : pipeline.name,
      description: data.description !== undefined ? data.description : pipeline.description,
      isDefault: data.isDefault !== undefined ? data.isDefault : pipeline.isDefault,
      lanes: data.lanes !== undefined ? data.lanes : pipeline.lanes,
      updatedAt: new Date()
    };
    
    this.pipelines.set(id, updatedPipeline);
    return updatedPipeline;
  }
  
  async deletePipeline(id: number): Promise<boolean> {
    return this.pipelines.delete(id);
  }
  
  async setDefaultPipeline(id: number): Promise<Pipeline | undefined> {
    const pipeline = this.pipelines.get(id);
    if (!pipeline) return undefined;
    
    // Set all pipelines to non-default
    for (const [pipelineId, p] of this.pipelines.entries()) {
      if (p.isDefault) {
        this.pipelines.set(pipelineId, { ...p, isDefault: false, updatedAt: new Date() });
      }
    }
    
    // Set target pipeline as default
    const updatedPipeline: Pipeline = {
      ...pipeline,
      isDefault: true,
      updatedAt: new Date()
    };
    
    this.pipelines.set(id, updatedPipeline);
    return updatedPipeline;
  }
  
  async updateLaneInPipeline(pipelineId: number, laneId: string, newName: string): Promise<Pipeline | undefined> {
    const pipeline = this.pipelines.get(pipelineId);
    if (!pipeline) return undefined;
    
    // Find and update the lane name
    const updatedLanes = pipeline.lanes.map(lane => 
      lane.id === laneId ? { ...lane, name: newName } : lane
    );
    
    const updatedPipeline: Pipeline = {
      ...pipeline,
      lanes: updatedLanes,
      updatedAt: new Date()
    };
    
    this.pipelines.set(pipelineId, updatedPipeline);
    return updatedPipeline;
  }
}

export const storage = new MemStorage();
