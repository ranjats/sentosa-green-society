import { useEffect, useState } from 'react';
import { amenitiesAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Package, CheckCircle, XCircle, Clock, History, RotateCcw } from 'lucide-react';

export default function Amenities() {
  const [amenities, setAmenities] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [requestForm, setRequestForm] = useState({ amenity_id: '', quantity: 1, required_date: '', return_date: '' });
  const [addForm, setAddForm] = useState({ name: '', category: '', quantity_available: 1, description: '' });
  const [activeTab, setActiveTab] = useState('request');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [amenitiesData, requestsData] = await Promise.all([
      amenitiesAPI.getAll(),
      amenitiesAPI.getRequests(),
    ]);
    setAmenities(amenitiesData);
    setRequests(requestsData);
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setError('');
    
    const amenity = amenities.find(a => a.id == requestForm.amenity_id);
    if (amenity && requestForm.quantity > amenity.available_quantity) {
      setError(`Only ${amenity.available_quantity} items available. You requested ${requestForm.quantity}.`);
      return;
    }
    
    try {
      const response = await amenitiesAPI.request(requestForm);
      if (response.error) {
        setError(response.error);
        return;
      }
      setRequestForm({ amenity_id: '', quantity: 1, required_date: '', return_date: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    await amenitiesAPI.create(addForm);
    setAddForm({ name: '', category: '', quantity_available: 1, description: '' });
    setShowForm(false);
    fetchData();
  };

  const handleApprove = async (id) => {
    await amenitiesAPI.approve(id, {});
    fetchData();
  };

  const handleReject = async (id) => {
    await amenitiesAPI.reject(id, {});
    fetchData();
  };

  const handleReturn = async (id) => {
    await amenitiesAPI.returnItem(id);
    fetchData();
  };

  const handleApproveReturn = async (id) => {
    await amenitiesAPI.approveReturn(id, {});
    fetchData();
  };

  const handleRejectReturn = async (id) => {
    await amenitiesAPI.rejectReturn(id, {});
    fetchData();
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      returned: 'bg-blue-100 text-blue-800',
      returned_approved: 'bg-purple-100 text-purple-800',
      returned_rejected: 'bg-orange-100 text-orange-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getStockStatus = (amenity) => {
    if (amenity.available_quantity === 0) {
      return { text: 'Out of Stock', color: 'text-red-600', bg: 'bg-red-100' };
    } else if (amenity.available_quantity < amenity.total_quantity * 0.3) {
      return { text: `Low Stock (${amenity.available_quantity})`, color: 'text-orange-600', bg: 'bg-orange-100' };
    }
    return { text: `In Stock (${amenity.available_quantity})`, color: 'text-green-600', bg: 'bg-green-100' };
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Amenities</h1>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Available Amenities</h2>
          {isAdmin && (
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
            >
              <Plus size={20} />
              Add Amenity
            </button>
          )}
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({...addForm, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={addForm.category}
                  onChange={(e) => setAddForm({...addForm, category: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity Available</label>
                <input
                  type="number"
                  value={addForm.quantity_available}
                  onChange={(e) => setAddForm({...addForm, quantity_available: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border rounded-lg"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={addForm.description}
                  onChange={(e) => setAddForm({...addForm, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="mt-4">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                Add Amenity
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {amenities.map((amenity) => {
            const stockStatus = getStockStatus(amenity);
            return (
              <div key={amenity.id} className={`border rounded-lg p-4 hover:shadow-md transition ${amenity.available_quantity === 0 ? 'opacity-75' : ''}`}>
                <div className="flex items-start justify-between">
                  <Package className="text-blue-500" size={24} />
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">{amenity.category || 'General'}</span>
                </div>
                <h3 className="font-semibold text-gray-800 mt-2">{amenity.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                <div className="mt-3 space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Total Stock:</span>
                    <span className="font-medium text-gray-800">{amenity.total_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Taken:</span>
                    <span className="font-medium text-orange-600">{amenity.taken_quantity}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Available:</span>
                    <span className={`font-medium ${stockStatus.color}`}>{amenity.available_quantity}</span>
                  </div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${stockStatus.bg} ${stockStatus.color}`}>
                    {stockStatus.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex gap-4 mb-6 border-b">
          {!isAdmin && (
            <button
              onClick={() => setActiveTab('request')}
              className={`pb-2 px-1 font-semibold ${activeTab === 'request' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
            >
              Request Amenity
            </button>
          )}
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2 px-1 font-semibold flex items-center gap-2 ${activeTab === 'history' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
          >
            <History size={18} />
            History
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {activeTab === 'request' && !isAdmin && (
          <form onSubmit={handleRequest} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amenity</label>
              <select
                value={requestForm.amenity_id}
                onChange={(e) => {
                  setRequestForm({...requestForm, amenity_id: e.target.value});
                  setError('');
                }}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select...</option>
                {amenities.filter(a => a.available_quantity > 0).map(a => (
                  <option key={a.id} value={a.id}>{a.name} ({a.available_quantity} available)</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                value={requestForm.quantity}
                onChange={(e) => {
                  setRequestForm({...requestForm, quantity: parseInt(e.target.value) || 0});
                  setError('');
                }}
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                max={amenities.find(a => a.id == requestForm.amenity_id)?.available_quantity || 1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Required Date</label>
              <input
                type="date"
                value={requestForm.required_date}
                onChange={(e) => setRequestForm({...requestForm, required_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Date</label>
              <input
                type="date"
                value={requestForm.return_date}
                onChange={(e) => setRequestForm({...requestForm, return_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div className="md:col-span-4 flex items-end">
              <button type="submit" className="w-full bg-green-500 text-white py-2 rounded-lg hover:bg-green-600">
                Request
              </button>
            </div>
          </form>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No request history found</p>
            ) : (
              requests.map((request) => (
                <div key={request.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-gray-800">{request.amenity_name}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                      {request.return_status && request.return_status !== 'none' && (
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.return_status)}`}>
                          {request.return_status}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      By: {request.user_name} (House {request.house_no}) • Qty: {request.quantity} • Required: {request.required_date}
                    </p>
                    {request.return_date && (
                      <p className="text-sm text-gray-600 mt-1">
                        Return Date: {request.return_date}
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Requested: {new Date(request.created_at).toLocaleString()}
                    </p>
                    {request.admin_notes && (
                      <p className="text-sm text-gray-500 mt-1">Admin Notes: {request.admin_notes}</p>
                    )}
                  </div>
                  {isAdmin && request.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(request.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle size={24} />
                      </button>
                      <button
                        onClick={() => handleReject(request.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle size={24} />
                      </button>
                    </div>
                  )}
                  {!isAdmin && request.status === 'approved' && (
                    <button
                      onClick={() => handleReturn(request.id)}
                      className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                    >
                      <RotateCcw size={16} />
                      Mark Returned
                    </button>
                  )}
                  {isAdmin && request.return_status === 'returned' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveReturn(request.id)}
                        className="text-green-600 hover:text-green-800"
                      >
                        <CheckCircle size={24} />
                      </button>
                      <button
                        onClick={() => handleRejectReturn(request.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <XCircle size={24} />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
