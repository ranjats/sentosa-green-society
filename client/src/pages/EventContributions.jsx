import { useEffect, useState } from 'react';
import { eventsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, Filter, Plus, CheckCircle, XCircle, Calendar, Users } from 'lucide-react';

export default function EventContributions() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [filters, setFilters] = useState({ eventId: '', search: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ amount: 0, payment_date: '' });
  const [totalAmount, setTotalAmount] = useState(0);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchContributions();
      fetchTotal();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    const data = await eventsAPI.getAll();
    setEvents(data);
  };

  const fetchContributions = async () => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    const data = await eventsAPI.getContributions(selectedEvent);
    setContributions(data);
  };

  const fetchTotal = async () => {
    const data = await eventsAPI.getTotalContributions(selectedEvent);
    setTotalAmount(data.total);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await eventsAPI.addContribution(selectedEvent, addForm);
    setShowAddForm(false);
    setAddForm({ amount: 0, payment_date: '' });
    fetchContributions();
    fetchTotal();
  };

  const handleApprove = async (id) => {
    await eventsAPI.approveContribution(id);
    fetchContributions();
  };

  const handleReject = async (id) => {
    await eventsAPI.rejectContribution(id);
    fetchContributions();
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Event Contributions</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-800">Select Event</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <select
              value={selectedEvent || ''}
              onChange={(e) => setSelectedEvent(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Select an Event --</option>
              {events.map(event => (
                <option key={event.id} value={event.id}>
                  {event.title} - {event.event_date} ({event.event_type})
                </option>
              ))}
            </select>
          </div>
          {selectedEvent && (
            <div className="flex items-center">
              <div className="bg-blue-50 rounded-lg p-3 w-full">
                <div className="flex items-center gap-2">
                  <DollarSign className="text-green-500" size={20} />
                  <div>
                    <p className="text-sm text-gray-500">Total Collected</p>
                    <p className="text-xl font-bold text-gray-800">₹{totalAmount.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedEvent && (
        <>
          <div className="bg-white rounded-xl shadow-md p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Contributions</h3>
              {!isAdmin && (
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                >
                  <Plus size={20} />
                  Add Contribution
                </button>
              )}
            </div>

            {showAddForm && (
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={addForm.amount}
                    onChange={(e) => setAddForm({...addForm, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Date</label>
                  <input
                    type="date"
                    value={addForm.payment_date}
                    onChange={(e) => setAddForm({...addForm, payment_date: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="md:col-span-2 flex items-end">
                  <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
                    Submit Contribution
                  </button>
                </div>
              </form>
            )}

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resident</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {contributions.map((contribution) => (
                    <tr key={contribution.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{contribution.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{contribution.house_no}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        ₹{contribution.amount?.toFixed(2) || '0.00'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {contribution.payment_date || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(contribution.status)}`}>
                          {contribution.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {isAdmin && contribution.status === 'pending' ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(contribution.id)} className="text-green-600 hover:text-green-800">
                              <CheckCircle size={20} />
                            </button>
                            <button onClick={() => handleReject(contribution.id)} className="text-red-600 hover:text-red-800">
                              <XCircle size={20} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">Read-only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
