import { useEffect, useState } from 'react';
import { residentsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Search } from 'lucide-react';

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', phone: '', email: '' });
  const [filters, setFilters] = useState({ search: '', house_no: '' });
  const { user } = useAuth();

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.house_no) params.append('house_no', filters.house_no);
    const data = await residentsAPI.getAll(params.toString());
    setResidents(data);
  };

  const handleEdit = (resident) => {
    if (resident.id !== user.id) return;
    setEditingId(resident.id);
    setFormData({ name: resident.name, phone: resident.phone, email: resident.email });
  };

  const handleSave = async (id) => {
    await residentsAPI.updateMe(formData);
    setEditingId(null);
    fetchResidents();
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Residents Directory</h1>
      
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name, phone, house..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              onKeyDown={(e) => e.key === 'Enter' && fetchResidents()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>
          <input
            type="text"
            placeholder="Filter by House No."
            value={filters.house_no}
            onChange={(e) => setFilters({...filters, house_no: e.target.value})}
            onKeyDown={(e) => e.key === 'Enter' && fetchResidents()}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={fetchResidents}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Apply Filters
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">House No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {residents.map((resident) => (
              <tr key={resident.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{resident.house_no}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {editingId === resident.id ? (
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    resident.name
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {editingId === resident.id ? (
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    resident.phone || '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {editingId === resident.id ? (
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="border rounded px-2 py-1 w-full"
                    />
                  ) : (
                    resident.email || '-'
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {editingId === resident.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleSave(resident.id)} className="text-green-600 hover:text-green-800">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-gray-600 hover:text-gray-800">Cancel</button>
                    </div>
                  ) : resident.id === user.id ? (
                    <button onClick={() => handleEdit(resident)} className="text-blue-600 hover:text-blue-800">
                      Edit
                    </button>
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
  );
}
