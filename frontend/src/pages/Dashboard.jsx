import React, { useState, useEffect } from 'react';
import { invoiceService } from '../services/invoiceService';
import Card from '../components/Card';
import Table from '../components/Table';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import './Dashboard.css';

const Dashboard = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(1000);
    const [processing, setProcessing] = useState(false);

    const fetchInvoices = async () => {
        setLoading(true);
        const data = await invoiceService.getInvoices();
        setInvoices(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    // Sync limit with service for auto-approval at creation
    useEffect(() => {
        invoiceService.setLimit(limit);
    }, [limit]);

    const handleAutoApprove = async () => {
        setProcessing(true);
        await invoiceService.runAutoApproval(limit);
        await fetchInvoices();
        setProcessing(false);
    };

    const handleApprove = async (id) => {
        setProcessing(true); // varying granularity, maybe per row? simplified here
        await invoiceService.updateStatus(id, 'Approved');
        await fetchInvoices();
        setProcessing(false);
    };

    const columns = [
        { header: 'Invoice ID', accessor: 'id' },
        { header: 'Vendor', accessor: 'vendor' },
        {
            header: 'Amount',
            accessor: 'amount',
            render: (row) => `$${row.amount.toFixed(2)}`,
            align: 'right'
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => <Badge status={row.status} />
        },
        {
            header: 'Action',
            accessor: 'action',
            align: 'center',
            render: (row) => (
                row.status === 'Needs Approval' ? (
                    <Button
                        size="sm"
                        variant="success"
                        onClick={() => handleApprove(row.id)}
                        disabled={processing}
                    >
                        Approve
                    </Button>
                ) : null
            )
        }
    ];

    return (
        <div className="dashboard-page">
            <div className="dashboard-header">
                <h1>PayGuard Dashboard</h1>
                <p>Overview of all invoices and approval controls.</p>
            </div>

            <Card title="Auto-Approval Settings" className="limit-card">
                <div className="limit-controls">
                    <Input
                        label="Auto-Approval Limit ($)"
                        type="number"
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="limit-input"
                    />
                    <Button
                        onClick={handleAutoApprove}
                        disabled={processing}
                        className="limit-button"
                    >
                        {processing ? 'Processing...' : 'Apply Auto-Approval Rules'}
                    </Button>
                </div>
                <p className="limit-hint">
                    Invoices under ${limit} will be automatically approved when you run this rule.
                </p>
            </Card>

            <Card title="Invoices">
                {loading ? (
                    <div className="loading">Loading invoices...</div>
                ) : (
                    <>
                        <Table columns={columns} data={invoices} />
                        <div className="status-legend">
                            <span className="legend-item"><Badge status="Paid" /> Payment completed</span>
                            <span className="legend-item"><Badge status="Approved" /> Ready for payment</span>
                            <span className="legend-item"><Badge status="Needs Approval" /> Manual review required</span>
                        </div>
                    </>
                )}
            </Card>
        </div>
    );
};

export default Dashboard;
