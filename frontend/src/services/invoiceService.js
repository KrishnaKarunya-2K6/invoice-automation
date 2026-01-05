import { initialInvoices, validVendors } from './mockData';

// Simulated database
let invoices = [...initialInvoices];
let currentLimit = 1000; // Default limit

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const validateInvoice = (invoice) => {
    // 1. Vendor Registration Check
    const isRegistered = validVendors.some(v => v.id === invoice.vendorId);

    // 2. Structure Validation
    const hasRequiredFields =
        invoice.id &&
        invoice.vendorId &&
        invoice.amount &&
        invoice.description; // vendor name is derived or optional in payload if ID is present

    return {
        isValid: isRegistered && hasRequiredFields,
        isRegistered,
        hasRequiredFields
    };
};

export const invoiceService = {
    setLimit: (limit) => {
        currentLimit = limit;
    },

    getInvoices: async () => {
        await delay(500);
        return [...invoices];
    },

    getRegisteredVendors: async () => {
        await delay(200);
        return [...validVendors];
    },

    getInvoiceById: async (id) => {
        await delay(300);
        return invoices.find(inv => inv.id === id);
    },

    addInvoice: async (invoice) => {
        await delay(800);

        // Auto-fill vendor name if ID is known, else use provided name (unregistered case)
        const knownVendor = validVendors.find(v => v.id === invoice.vendorId);

        // Determine status based on active rules
        const validation = validateInvoice(invoice);
        let status = 'Needs Approval';

        if (validation.isRegistered && validation.isValid && invoice.amount <= currentLimit) {
            status = 'Approved';
        }

        const newInvoice = {
            ...invoice,
            vendor: knownVendor ? knownVendor.name : (invoice.vendor || 'Unknown Vendor'),
            status: status,
            date: new Date().toISOString().split('T')[0]
        };
        invoices = [newInvoice, ...invoices];
        return newInvoice;
    },

    updateStatus: async (id, status) => {
        await delay(500);
        invoices = invoices.map(inv =>
            inv.id === id ? { ...inv, status } : inv
        );
        return invoices.find(inv => inv.id === id);
    },

    // Simulate auto-approval logic with Risk Engine
    runAutoApproval: async (limit) => {
        await delay(600);
        let approvedCount = 0;

        invoices = invoices.map(inv => {
            // Only process pending invoices
            if (inv.status !== 'Needs Approval') return inv;

            // RISK ENGINE LOGIC
            const validation = validateInvoice(inv);

            // Rule 1: Vendor must be registered
            if (!validation.isRegistered) return inv; // Stay in Needs Approval

            // Rule 2: Invoice must be valid
            if (!validation.isValid) return inv; // Stay in Needs Approval

            // Rule 3: Amount must be <= limit
            if (inv.amount > limit) return inv; // Stay in Needs Approval

            // If all pass -> Auto Approve
            approvedCount++;
            return { ...inv, status: 'Approved' };
        });

        return approvedCount;
    }
};
