import { useEffect, useState } from 'react';
import { contributionsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, Filter, Plus, CheckCircle, XCircle } from 'lucide-react';

export default function Contributions() {
  const [contributions, setContributions] = useState([]);
  const [filters, setFilters] = useState({ month: '', search: '' });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ month: '', amount: 0, payment_date: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchContributions();
  }, []);

  const fetchContributions = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.search) params.append('search', filters.search);
      const data = await contributionsAPI.getAll(params.toString());
      setContributions(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load contributions. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await contributionsAPI.addForMonth(addForm.month, addForm.amount, addForm.payment_date);
      setShowAddForm(false);
      setAddForm({ month: '', amount: 0, payment_date: '' });
      fetchContributions();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to submit contribution');
    }
  };

  const handleApprove = async (id) => {
    try {
      await contributionsAPI.approve(id, {});
      fetchContributions();
    } catch (err) {
      console.error(err);
      alert('Failed to approve contribution');
    }
  };

  const handleReject = async (id) => {
    try {
      await contributionsAPI.reject(id, {});
      fetchContributions();
    } catch (err) {
      console.error(err);
      alert('Failed to reject contribution');
    }
  };

  const totalAmount = contributions
    .filter(c => c.status === 'approved')
    .reduce((sum, c) => sum + (c.amount || 0), 0);

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
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Monthly Contributions</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <DollarSign className="text-green-500" size={32} />
            <div>
              <p className="text-gray-500 text-sm">Total Approved Contributions</p>
              <p className="text-3xl font-bold text-gray-800">₹{totalAmount.toFixed(2)}</p>
            </div>
          </div>
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
      </div>

      {!isAdmin && showAddForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Submit Monthly Contribution</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <input
                type="month"
                value={addForm.month}
                onChange={(e) => setAddForm({...addForm, month: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />
            </div>
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
            <div className="flex items-end">
              <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
                Submit
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="text-gray-500" size={20} />
          <h3 className="font-semibold text-gray-700">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Month (YYYY-MM)</label>
            <input
              type="month"
              value={filters.month}
              onChange={(e) => setFilters({...filters, month: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search (Name / House / Phone)</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && fetchContributions()}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchContributions}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
          <button onClick={fetchContributions} className="ml-4 underline">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Loading contributions...
                </td>
              </tr>
            ) : contributions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No contributions found. {!isAdmin && 'Add your first contribution above.'}
                </td>
              </tr>
            ) : (
              contributions.map((contribution) => (
                <tr key={contribution.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {contribution.month}
                    {contribution.month === new Date().toISOString().slice(0, 7) && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Current</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {contribution.payment_date || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{contribution.house_no}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{contribution.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    ₹{contribution.amount?.toFixed(2) || '0.00'}
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
              )}
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
