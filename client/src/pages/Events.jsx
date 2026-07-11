import { useEffect, useState } from 'react';
import { eventsAPI } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Calendar, MapPin, Users, ChevronDown, ChevronUp, Edit, X, Lock, Unlock, UserX, User, Clock } from 'lucide-react';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [expandedEvent, setExpandedEvent] = useState(null);
  const [familyForm, setFamilyForm] = useState({ male: 0, female: 0, children: 0 });
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'general',
    event_date: '',
    event_time: '',
    location: ''
  });
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const data = await eventsAPI.getAll();
    setEvents(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    await eventsAPI.create(formData);
    setShowForm(false);
    setFormData({ title: '', description: '', event_type: 'general', event_date: '', event_time: '', location: '' });
    fetchEvents();
  };

  const handleEdit = (event) => {
    setEditingEvent(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      event_date: event.event_date,
      event_time: event.event_time,
      location: event.location
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await eventsAPI.update(editingEvent, formData);
    setEditingEvent(null);
    setFormData({ title: '', description: '', event_type: 'general', event_date: '', event_time: '', location: '' });
    fetchEvents();
  };

  const handleCloseEvent = async (eventId) => {
    await eventsAPI.close(eventId);
    fetchEvents();
  };

  const handleOpenEvent = async (eventId) => {
    await eventsAPI.open(eventId);
    fetchEvents();
  };

  const handleParticipate = async (eventId) => {
    await eventsAPI.participate(eventId, 'participating', familyForm);
    setExpandedEvent(null);
    setFamilyForm({ male: 0, female: 0, children: 0 });
    fetchEvents();
  };

  const handleRemoveParticipation = async (eventId) => {
    await eventsAPI.removeParticipation(eventId);
    fetchEvents();
  };

  const toggleEvent = (eventId) => {
    const isExpanded = expandedEvent === eventId;
    setExpandedEvent(isExpanded ? null : eventId);
    
    if (!isExpanded) {
      const event = events.find(e => e.id === eventId);
      if (event?.myParticipation) {
        setFamilyForm({
          male: event.myParticipation.male_count || 0,
          female: event.myParticipation.female_count || 0,
          children: event.myParticipation.children_count || 0
        });
      } else {
        setFamilyForm({ male: 0, female: 0, children: 0 });
      }
    }
  };

  const getEventTypeColor = (type) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      sports: 'bg-green-100 text-green-800',
      festival: 'bg-purple-100 text-purple-800',
      meeting: 'bg-gray-100 text-gray-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Events</h1>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            <Plus size={20} />
            Create Event
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Create New Event</h2>
            <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="general">General</option>
                <option value="sports">Sports</option>
                <option value="festival">Festival</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
                Create Event
              </button>
            </div>
          </form>
        </div>
      )}

      {isAdmin && editingEvent && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8 border-l-4 border-green-500">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Edit Event</h2>
            <button onClick={() => setEditingEvent(null)} className="text-gray-500 hover:text-gray-700">
              <X size={24} />
            </button>
          </div>
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.event_type}
                onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="general">General</option>
                <option value="sports">Sports</option>
                <option value="festival">Festival</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={formData.event_date}
                onChange={(e) => setFormData({...formData, event_date: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
              <input
                type="time"
                value={formData.event_time}
                onChange={(e) => setFormData({...formData, event_time: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full px-3 py-2 border rounded-lg"
                rows="3"
              />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600">
                Update Event
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <div key={event.id} className={`bg-white rounded-xl shadow-md p-6 border-t-4 ${event.status === 'closed' ? 'border-red-500 opacity-75' : 'border-blue-500'}`}>
            <div 
              className="flex items-start justify-between mb-4 cursor-pointer"
              onClick={() => toggleEvent(event.id)}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.event_type)}`}>
                    {event.event_type}
                  </span>
                  {event.status === 'closed' && (
                    <span className="inline-block px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                      Closed
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
              </div>
              {expandedEvent === event.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            
            <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock size={16} className="text-gray-400" />
                {event.event_date} {event.event_time}
              </div>
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  {event.location}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Users size={16} className="text-gray-400" />
                <span className="font-medium">{event.participants?.length || 0}</span> participating
              </div>
            </div>

            {isAdmin && event.status === 'open' && (
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => handleEdit(event)}
                  className="flex-1 bg-yellow-100 text-yellow-700 py-2 rounded-lg hover:bg-yellow-200 flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleCloseEvent(event.id)}
                  className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Lock size={16} />
                  Close
                </button>
              </div>
            )}

            {isAdmin && event.status === 'closed' && (
              <div className="mb-4">
                <button
                  onClick={() => handleOpenEvent(event.id)}
                  className="w-full bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 flex items-center justify-center gap-1 text-sm font-medium"
                >
                  <Unlock size={16} />
                  Reopen Event
                </button>
              </div>
            )}

            {expandedEvent === event.id && (
              <div className="border-t pt-4 mb-4">
                <h4 className="font-semibold text-gray-800 mb-3">Participants</h4>
                {event.participants?.length === 0 ? (
                  <p className="text-sm text-gray-500">No participants yet</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {event.participants?.map((p, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="font-medium">{p.name} <span className="text-gray-500">({p.house_no})</span></span>
                        <span className="text-gray-600">
                          {p.male_count > 0 && <span>M:{p.male_count} </span>}
                          {p.female_count > 0 && <span>F:{p.female_count} </span>}
                          {p.children_count > 0 && <span>C:{p.children_count}</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!isAdmin && event.status === 'open' && (
              <div className="flex gap-2">
                {event.myParticipation?.status === 'participating' ? (
                  <button
                    onClick={() => handleRemoveParticipation(event.id)}
                    className="flex-1 bg-red-100 text-red-700 py-2 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1 text-sm font-medium"
                  >
                    <UserX size={16} />
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => toggleEvent(event.id)}
                    className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg hover:bg-green-200 flex items-center justify-center gap-1 text-sm font-medium"
                  >
                    <User size={16} />
                    Participate
                  </button>
                )}
              </div>
            )}

            {expandedEvent === event.id && !isAdmin && event.status === 'open' && (
              <div className="border-t pt-4 mt-4">
                <h4 className="font-semibold text-gray-800 mb-3">
                  {event.myParticipation?.status === 'participating' ? 'Edit Participation' : 'Add Family Members'}
                </h4>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Male</label>
                    <input
                      type="number"
                      min="0"
                      value={familyForm.male}
                      onChange={(e) => setFamilyForm({...familyForm, male: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Female</label>
                    <input
                      type="number"
                      min="0"
                      value={familyForm.female}
                      onChange={(e) => setFamilyForm({...familyForm, female: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Children</label>
                    <input
                      type="number"
                      min="0"
                      value={familyForm.children}
                      onChange={(e) => setFamilyForm({...familyForm, children: parseInt(e.target.value) || 0})}
                      className="w-full px-3 py-2 border rounded-lg text-center"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleParticipate(event.id)}
                  className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
                >
                  {event.myParticipation?.status === 'participating' ? 'Update Participation' : 'Confirm Participation'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
