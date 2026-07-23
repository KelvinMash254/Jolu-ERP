import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { crmApi, securityApi, inventoryApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { KENYA_COUNTIES } from '../constants/counties';

const TRACTOR_CATALOG = [
  { name: "NEW ZOOMLION TRACTOR MODEL RK 504 -A", price: 2500000 },
  { name: "NEW ZOOMLION TRACTOR MODEL RK 704 -A", price: 3200000 },
  { name: "NEW ZOOMLION TRACTOR MODEL RC 904 -A", price: 4300000 },
  { name: "NEW ZOOMLION TRACTOR MODEL RN 904 (PRO)", price: 4800000 },
  { name: "NEW ZOOMLION TRACTOR MODEL RC 1104 -A (OLD MODEL)", price: 4500000 },
  { name: "NEW ZOOMLION TRACTOR MODEL RC 1104 -A (NEW MODEL)", price: 4800000 },
  { name: "NEW ZOOMLION TRACTOR MODEL RS 1604 -A", price: 8800000 },
  { name: "NEW ZOOMLION RICE HARVESTER ZL 105", price: 6500000 },
];

const IMPLEMENT_CATALOG = [
  { name: "2 Disc Plough Heavy Duty", price: 300000 },
  { name: "3 Disc Heavy Duty", price: 600000 },
  { name: "3 Disc Mounted Disc Plough", price: 600000 },
  { name: "Advanced 5 Disc Plough", price: 950000 },
  { name: "Hydraulic Pressure Offset Disc Harrow", price: 550000 },
  { name: "Disc Harrows", price: 400000 },
  { name: "Heavy Duty Water Bowsers", price: 850000 },
  { name: "Trailer", price: 650000 },
  { name: "Tipping & Non-Tipping Trailers", price: 650000 },
];

const SECURITY_SERVICES_CATALOG = [
  { name: "Day Guard Service", price: 15000 },
  { name: "Night Guard Service", price: 15000 },
  { name: "24-Hour Guard Service", price: 30000 },
  { name: "Supervisor Guard Service", price: 20000 },
  { name: "K-9 (Dog) Guard Service", price: 25000 },
  { name: "CCTV Installation & Maintenance", price: 45000 },
  { name: "Alarm Response System", price: 10000 },
  { name: "VIP Escort & Bodyguard Services", price: 50000 },
];

const AUTOMOBILE_SERVICES_CATALOG = [
  { name: "Car Hire / Rental Service (Daily)", price: 5000 },
  { name: "Chauffeur / Driver Service (Daily)", price: 2000 },
  { name: "Airport Transfer Service", price: 3500 },
  { name: "Vehicle Maintenance / Service", price: 8000 },
  { name: "Wheel Alignment & Wheel Balancing", price: 2500 },
  { name: "Full Body Car Wash & Detailing", price: 1500 },
];

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function InvoiceModal({ isOpen, onClose, onSubmit, initialData }: InvoiceModalProps) {
  const { currentCompany } = useAuthStore();
  const [type, setType] = useState(initialData?.type || 'INVOICE');
  const [customerId, setCustomerId] = useState(initialData?.customerId || '');
  const [securityClientId, setSecurityClientId] = useState(initialData?.securityClientId || '');
  const [contractId, setContractId] = useState(initialData?.contractId || '');
  const [dueDate, setDueDate] = useState(initialData?.dueDate || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [lines, setLines] = useState(initialData?.lines || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, total: 0 }]);

  // Quick Add Form States
  const [showQuickAddCustomer, setShowQuickAddCustomer] = useState(false);
  const [showQuickAddSecurityClient, setShowQuickAddSecurityClient] = useState(false);

  // Quick Customer Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custCounty, setCustCounty] = useState('');
  const [custID, setCustID] = useState('');
  const [custKRA, setCustKRA] = useState('');
  const [custAddress, setCustAddress] = useState('');

  // Quick Security Client Form State
  const [scName, setScName] = useState('');
  const [scPhone, setScPhone] = useState('');
  const [scEmail, setScEmail] = useState('');
  const [scContactPerson, setScContactPerson] = useState('');
  const [scAddress, setScAddress] = useState('');
  const [scKRA, setScKRA] = useState('');

  const queryClient = useQueryClient();

  const createCustomerMutation = useMutation({
    mutationFn: (data: any) => crmApi.createCustomer(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      const newCust = res.data?.data;
      if (newCust?.id) {
        setCustomerId(newCust.id);
      }
      setShowQuickAddCustomer(false);
      toast.success('Customer created and selected');
    },
    onError: () => toast.error('Failed to create customer'),
  });

  const createSecurityClientMutation = useMutation({
    mutationFn: (data: any) => securityApi.createClient(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['security-clients'] });
      queryClient.invalidateQueries({ queryKey: ['sec-clients'] });
      const newClient = res.data?.data;
      if (newClient?.id) {
        setSecurityClientId(newClient.id);
      }
      setShowQuickAddSecurityClient(false);
      toast.success('Security client created and selected');
    },
    onError: () => toast.error('Failed to create security client'),
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setType(initialData.type || 'INVOICE');
        setCustomerId(initialData.customerId || '');
        setSecurityClientId(initialData.securityClientId || '');
        setContractId(initialData.contractId || '');
        setLines(initialData.lines || [{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, total: 0 }]);
      } else if (currentCompany?.code === 'SECURITY') {
        setLines([{ description: 'Security Services', quantity: 1, unitPrice: 15000, taxRate: 0, total: 15000 }]);
      } else {
        setLines([{ description: '', quantity: 1, unitPrice: 0, taxRate: 0, total: 0 }]);
      }
    }
  }, [isOpen, initialData, currentCompany]);

  const { data: customersData } = useQuery({
    queryKey: ['customers'],
    queryFn: () => crmApi.getCustomers(),
    enabled: isOpen,
  });

  const { data: securityClientsData } = useQuery({
    queryKey: ['security-clients'],
    queryFn: () => securityApi.getClients(),
    enabled: isOpen,
  });

  const { data: sparePartsData } = useQuery({
    queryKey: ['spare-parts-invoice'],
    queryFn: () => inventoryApi.getSpareParts(),
    enabled: isOpen && (currentCompany?.code === 'MACHINERIES' || currentCompany?.code === 'SECURITY'),
  });

  const { data: machineryData } = useQuery({
    queryKey: ['machinery-units-invoice'],
    queryFn: () => inventoryApi.getMachinery(),
    enabled: isOpen && currentCompany?.code === 'MACHINERIES',
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['vehicles-units-invoice'],
    queryFn: () => inventoryApi.getVehicles(),
    enabled: isOpen && currentCompany?.code === 'AUTOMOBILE',
  });

  const customers = customersData?.data?.data || [];
  const securityClients = securityClientsData?.data?.data || [];
  const spareParts = sparePartsData?.data?.data || [];
  const machineryUnits = (machineryData?.data?.data || []).filter((u: any) => u.stockStatus === 'IN_STOCK');
  const vehicles = vehiclesData?.data?.data || [];

  const addLine = () => {
    setLines([...lines, { description: '', quantity: 1, unitPrice: 0, taxRate: 0, total: 0 }]);
  };

  const removeLine = (index: number) => {
    setLines(lines.filter((_: any, i: number) => i !== index));
  };

  const updateLine = (index: number, field: string, value: any) => {
    const newLines = [...lines];
    const line = { ...newLines[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice') {
      line.total = Number(line.quantity) * Number(line.unitPrice);
    }
    
    newLines[index] = line;
    setLines(newLines);
  };

  const subtotal = lines.reduce((sum: number, line: any) => sum + line.total, 0);
  const taxAmount = lines.reduce((sum: number, line: any) => sum + (line.total * (line.taxRate / 100)), 0);
  const total = subtotal + taxAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      customerId: customerId || undefined,
      securityClientId: securityClientId || undefined,
      contractId: contractId || undefined,
      dueDate,
      notes,
      lines,
    });
  };

  const handleQuickAddCustomerSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!custName || !custPhone) {
      toast.error('Name and Phone are required');
      return;
    }
    createCustomerMutation.mutate({
      name: custName,
      phone: custPhone,
      email: custEmail || undefined,
      county: custCounty || undefined,
      idNumber: custID || undefined,
      kraPin: custKRA || undefined,
      physicalAddress: custAddress || undefined,
    });
  };

  const handleQuickAddSecurityClientSubmit = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!scName || !scPhone) {
      toast.error('Name and Phone are required');
      return;
    }
    createSecurityClientMutation.mutate({
      name: scName,
      phone: scPhone,
      email: scEmail || undefined,
      contactPerson: scContactPerson || undefined,
      address: scAddress || undefined,
      kraPin: scKRA || undefined,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">Create New Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Type</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              >
                <option value="PROFORMA">Proforma Invoice</option>
                <option value="INVOICE">Invoice</option>
                <option value="QUOTATION">Quotation</option>
                <option value="DELIVERY_NOTE">Delivery Note</option>
                <option value="RECEIPT">Receipt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              />
            </div>

            {(currentCompany?.code === 'MACHINERIES' || currentCompany?.code === 'AUTOMOBILE') && (
              <div className="md:col-span-2 space-y-4">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                    <select 
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
                    >
                      <option value="">Select Customer</option>
                      {customers.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuickAddCustomer(!showQuickAddCustomer);
                      setCustName('');
                      setCustPhone('');
                      setCustEmail('');
                      setCustCounty('');
                      setCustID('');
                      setCustKRA('');
                      setCustAddress('');
                    }}
                    className="px-3 py-2 bg-jolu-50 text-jolu-700 hover:bg-jolu-100 rounded-lg text-sm font-semibold border border-jolu-200 h-[42px] flex items-center justify-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Quick Add
                  </button>
                </div>

                {showQuickAddCustomer && (
                  <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                    <h4 className="text-sm font-bold text-gray-700">Quick Add New Customer</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Name *</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={custName} onChange={e => setCustName(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Phone *</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={custPhone} onChange={e => setCustPhone(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Email</label>
                        <input type="email" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={custEmail} onChange={e => setCustEmail(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">County</label>
                        <select className="w-full text-xs rounded border-gray-300 py-1 px-2 bg-white" value={custCounty} onChange={e => setCustCounty(e.target.value)}>
                          <option value="">Select County</option>
                          {KENYA_COUNTIES.map(co => (
                            <option key={co} value={co}>{co}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">ID Number</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={custID} onChange={e => setCustID(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">KRA PIN</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={custKRA} onChange={e => setCustKRA(e.target.value)} />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-xs font-semibold text-gray-500">Physical Address</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={custAddress} onChange={e => setCustAddress(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button type="button" onClick={() => setShowQuickAddCustomer(false)} className="px-3 py-1 bg-white border text-gray-600 rounded text-xs">Cancel</button>
                      <button type="button" onClick={handleQuickAddCustomerSubmit} disabled={createCustomerMutation.isPending} className="px-3 py-1 bg-jolu-600 text-white rounded text-xs font-semibold hover:bg-jolu-700">{createCustomerMutation.isPending ? 'Saving...' : 'Save & Select'}</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {currentCompany?.code === 'SECURITY' && (
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Security Client</label>
                      <select
                        value={securityClientId}
                        onChange={(e) => {
                          setSecurityClientId(e.target.value);
                          setContractId('');
                        }}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
                      >
                        <option value="">Select Security Client</option>
                        {securityClients.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowQuickAddSecurityClient(!showQuickAddSecurityClient);
                        setScName('');
                        setScPhone('');
                        setScEmail('');
                        setScContactPerson('');
                        setScAddress('');
                        setScKRA('');
                      }}
                      className="px-3 py-2 bg-jolu-50 text-jolu-700 hover:bg-jolu-100 rounded-lg text-sm font-semibold border border-jolu-200 h-[42px] flex items-center justify-center gap-1"
                    >
                      <Plus className="w-4 h-4" /> Quick Add
                    </button>
                  </div>

                  {securityClientId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Contract</label>
                      <select
                        value={contractId}
                        onChange={(e) => setContractId(e.target.value)}
                        className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
                      >
                        <option value="">Select Contract</option>
                        {securityClients.find((c: any) => c.id === securityClientId)?.contracts?.map((con: any) => (
                          <option key={con.id} value={con.id}>{con.contractNumber}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {showQuickAddSecurityClient && (
                  <div className="p-4 bg-gray-50 border rounded-lg space-y-3">
                    <h4 className="text-sm font-bold text-gray-700">Quick Add New Security Client</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Name *</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={scName} onChange={e => setScName(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Phone *</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={scPhone} onChange={e => setScPhone(e.target.value)} required />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Email</label>
                        <input type="email" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={scEmail} onChange={e => setScEmail(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Contact Person</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={scContactPerson} onChange={e => setScContactPerson(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">KRA PIN</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={scKRA} onChange={e => setScKRA(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500">Address</label>
                        <input type="text" className="w-full text-xs rounded border-gray-300 py-1 px-2" value={scAddress} onChange={e => setScAddress(e.target.value)} />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button type="button" onClick={() => setShowQuickAddSecurityClient(false)} className="px-3 py-1 bg-white border text-gray-600 rounded text-xs">Cancel</button>
                      <button type="button" onClick={handleQuickAddSecurityClientSubmit} disabled={createSecurityClientMutation.isPending} className="px-3 py-1 bg-jolu-600 text-white rounded text-xs font-semibold hover:bg-jolu-700">{createSecurityClientMutation.isPending ? 'Saving...' : 'Save & Select'}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Line Items</h3>
              <button 
                type="button" 
                onClick={addLine}
                className="flex items-center gap-1 text-sm text-jolu-600 font-medium hover:text-jolu-700"
              >
                <Plus className="w-4 h-4" /> Add Line Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium w-20">Qty</th>
                    <th className="pb-2 font-medium w-32">Unit Price</th>
                    <th className="pb-2 font-medium w-24">Tax (%)</th>
                    <th className="pb-2 font-medium w-32 text-right">Total</th>
                    <th className="pb-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {lines.map((line: any, index: number) => (
                    <tr key={index}>
                      <td className="py-3 pr-4 space-y-2">
                        <input 
                          type="text" 
                          value={line.description} 
                          onChange={(e) => updateLine(index, 'description', e.target.value)}
                          placeholder="Item description"
                          className="w-full border-none focus:ring-0 p-0 text-sm font-semibold"
                          required
                        />
                        {currentCompany?.code === 'MACHINERIES' && (
                          <div className="pt-1">
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const [typePrefix, keyStr] = val.split('::');
                                const key = Number(keyStr);
                                if (typePrefix === 'tractor') {
                                  const item = TRACTOR_CATALOG[key];
                                  updateLine(index, 'description', item.name);
                                  updateLine(index, 'unitPrice', item.price);
                                } else if (typePrefix === 'implement') {
                                  const item = IMPLEMENT_CATALOG[key];
                                  updateLine(index, 'description', item.name);
                                  updateLine(index, 'unitPrice', item.price);
                                } else if (typePrefix === 'machinery') {
                                  const item = machineryUnits[key];
                                  const desc = `${item.brand} ${item.model} ${item.productName} (S/N: ${item.serialNumber || item.chassisNumber || item.id})`;
                                  updateLine(index, 'description', desc);
                                  updateLine(index, 'unitPrice', Number(item.sellingPrice));
                                } else if (typePrefix === 'sparepart') {
                                  const item = spareParts[key];
                                  const desc = `Spare Part: ${item.partName} (${item.partNumber})`;
                                  updateLine(index, 'description', desc);
                                  updateLine(index, 'unitPrice', Number(item.sellingPrice));
                                }
                                e.target.value = '';
                              }}
                              className="rounded border-gray-300 text-[11px] py-1 px-2 text-gray-600 focus:border-jolu-500 focus:ring-jolu-500 w-full max-w-xs"
                            >
                              <option value="">-- Choose Product / Spare Part --</option>
                              <optgroup label="Tractors (Flyer Catalog)">
                                {TRACTOR_CATALOG.map((item, i) => (
                                  <option key={i} value={`tractor::${i}`}>{item.name} - KES {item.price.toLocaleString()}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Implements (Flyer Catalog)">
                                {IMPLEMENT_CATALOG.map((item, i) => (
                                  <option key={i} value={`implement::${i}`}>{item.name} - KES {item.price.toLocaleString()}</option>
                                ))}
                              </optgroup>
                              {machineryUnits.length > 0 && (
                                <optgroup label="Machinery Inventory (In Stock)">
                                  {machineryUnits.map((item: any, i: number) => (
                                    <option key={item.id} value={`machinery::${i}`}>{item.brand} {item.model} {item.productName} (S/N: {item.serialNumber || 'N/A'}) - KES {Number(item.sellingPrice).toLocaleString()}</option>
                                  ))}
                                </optgroup>
                              )}
                              {spareParts.length > 0 && (
                                <optgroup label="Spare Parts Inventory">
                                  {spareParts.map((item: any, i: number) => (
                                    <option key={item.id} value={`sparepart::${i}`}>{item.partName} ({item.partNumber}) - KES {Number(item.sellingPrice).toLocaleString()}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        )}
                        {currentCompany?.code === 'AUTOMOBILE' && (
                          <div className="pt-1">
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const [typePrefix, keyStr] = val.split('::');
                                const key = Number(keyStr);
                                if (typePrefix === 'service') {
                                  const item = AUTOMOBILE_SERVICES_CATALOG[key];
                                  updateLine(index, 'description', item.name);
                                  updateLine(index, 'unitPrice', item.price);
                                } else if (typePrefix === 'vehicle') {
                                  const item = vehicles[key];
                                  const desc = `Vehicle Rental: ${item.make} ${item.model} (${item.registrationNumber})`;
                                  updateLine(index, 'description', desc);
                                  updateLine(index, 'unitPrice', Number(item.dailyRate || 0));
                                }
                                e.target.value = '';
                              }}
                              className="rounded border-gray-300 text-[11px] py-1 px-2 text-gray-600 focus:border-jolu-500 focus:ring-jolu-500 w-full max-w-xs"
                            >
                              <option value="">-- Choose Automobile Service / Vehicle --</option>
                              <optgroup label="Standard Automobile Services">
                                {AUTOMOBILE_SERVICES_CATALOG.map((item, i) => (
                                  <option key={i} value={`service::${i}`}>{item.name} - KES {item.price.toLocaleString()}</option>
                                ))}
                              </optgroup>
                              {vehicles.length > 0 && (
                                <optgroup label="Fleet Inventory Vehicles">
                                  {vehicles.map((item: any, i: number) => (
                                    <option key={item.id} value={`vehicle::${i}`}>{item.make} {item.model} ({item.registrationNumber}) - KES {Number(item.dailyRate || 0).toLocaleString()}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        )}
                        {currentCompany?.code === 'SECURITY' && (
                          <div className="pt-1">
                            <select
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) return;
                                const [typePrefix, keyStr] = val.split('::');
                                const key = Number(keyStr);
                                if (typePrefix === 'service') {
                                  const item = SECURITY_SERVICES_CATALOG[key];
                                  updateLine(index, 'description', item.name);
                                  updateLine(index, 'unitPrice', item.price);
                                  updateLine(index, 'taxRate', 0);
                                } else if (typePrefix === 'item') {
                                  const item = spareParts[key];
                                  const desc = `Security Item: ${item.partName} (${item.partNumber})`;
                                  updateLine(index, 'description', desc);
                                  updateLine(index, 'unitPrice', Number(item.sellingPrice || 0));
                                  updateLine(index, 'taxRate', 0);
                                }
                                e.target.value = '';
                              }}
                              className="rounded border-gray-300 text-[11px] py-1 px-2 text-gray-600 focus:border-jolu-500 focus:ring-jolu-500 w-full max-w-xs"
                            >
                              <option value="">-- Choose Security Service / Item --</option>
                              <optgroup label="Standard Security Services">
                                {SECURITY_SERVICES_CATALOG.map((item, i) => (
                                  <option key={i} value={`service::${i}`}>{item.name} - KES {item.price.toLocaleString()}</option>
                                ))}
                              </optgroup>
                              {spareParts.length > 0 && (
                                <optgroup label="Security Inventory Items">
                                  {spareParts.map((item: any, i: number) => (
                                    <option key={item.id} value={`item::${i}`}>{item.partName} ({item.partNumber}) - KES {Number(item.sellingPrice || 0).toLocaleString()}</option>
                                  ))}
                                </optgroup>
                              )}
                            </select>
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <input 
                          type="number" 
                          value={line.quantity} 
                          onChange={(e) => updateLine(index, 'quantity', e.target.value)}
                          className="w-full border-none focus:ring-0 p-0 text-sm"
                          min="1"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <input 
                          type="number" 
                          value={line.unitPrice} 
                          onChange={(e) => updateLine(index, 'unitPrice', e.target.value)}
                          className="w-full border-none focus:ring-0 p-0 text-sm"
                        />
                      </td>
                      <td className="py-3 pr-4">
                        <select 
                          value={line.taxRate} 
                          onChange={(e) => updateLine(index, 'taxRate', Number(e.target.value))}
                          className="w-full border-none focus:ring-0 p-0 text-sm bg-transparent"
                        >
                          <option value="0">0%</option>
                          <option value="16">16%</option>
                        </select>
                      </td>
                      <td className="py-3 text-right font-medium">
                        {line.total.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        <button 
                          type="button" 
                          onClick={() => removeLine(index)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col items-end space-y-2 border-t pt-4">
            <div className="flex justify-between w-64 text-sm">
              <span className="text-gray-500">Subtotal:</span>
              <span className="font-medium">KES {subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between w-64 text-sm">
              <span className="text-gray-500">VAT (16%):</span>
              <span className="font-medium">KES {taxAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between w-64 text-lg font-bold">
              <span>Total:</span>
              <span className="text-jolu-700">KES {total.toLocaleString()}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Terms</label>
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-jolu-500 focus:ring-jolu-500"
              placeholder="Payment terms, bank details, etc."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-6">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn-primary"
            >
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
