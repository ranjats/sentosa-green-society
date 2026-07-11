import { useEffect, useState } from 'react';
import { adminAPI, residentsAPI, eventsAPI } from '../api';
import { Users, Calendar, Package, DollarSign, MapPin, Clock, User, Sun, Moon, Coffee } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentEvents, setRecentEvents] = useState([]);
  const [residents, setResidents] = useState([]);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsData, residentsData] = await Promise.all([
          eventsAPI.getAll(),
          residentsAPI.getAll(),
        ]);
        setRecentEvents(eventsData.slice(0, 5));
        setResidents(residentsData);
      } catch (err) {
        console.error(err);
      }
      
      try {
        const statsData = await adminAPI.getStats();
        setStats(statsData);
      } catch (err) {
        console.log('Admin stats not available');
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const hour = new Date().getHours();
    let greet = '';
    let icon = null;
    
    if (hour >= 5 && hour < 12) {
      greet = 'Good Morning';
      icon = <Sun className="text-yellow-500" size={32} />;
    } else if (hour >= 12 && hour < 17) {
      greet = 'Good Afternoon';
      icon = <Coffee className="text-orange-500" size={32} />;
    } else {
      greet = 'Good Evening';
      icon = <Moon className="text-indigo-500" size={32} />;
    }
    
    setGreeting({ text: greet, icon });
  }, []);

  return (
    <div>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-md p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {greeting.text}, {stats ? 'Admin' : 'User'}! 👋
            </h1>
            <p className="text-blue-100 text-lg">
              Welcome to Sentosa Green Society Management Portal
            </p>
            <p className="text-blue-200 text-sm mt-2">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="hidden md:block">
            {greeting.icon}
          </div>
        </div>
      </div>
      
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Residents</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalResidents}</p>
              </div>
              <Users className="text-blue-500" size={40} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Events</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalEvents}</p>
              </div>
              <Calendar className="text-green-500" size={40} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Pending Requests</p>
                <p className="text-3xl font-bold text-gray-800">{stats.pendingRequests}</p>
              </div>
              <Package className="text-orange-500" size={40} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Contributions</p>
                <p className="text-3xl font-bold text-gray-800">₹{stats.totalContributions}</p>
              </div>
              <DollarSign className="text-purple-500" size={40} />
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="text-blue-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Recent Events</h2>
          </div>
          <div className="space-y-4">
            {recentEvents.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="mx-auto text-gray-300 mb-2" size={48} />
                <p className="text-gray-500">No events yet</p>
              </div>
            ) : (
              recentEvents.map(event => (
                <div key={event.id} className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          {event.event_type}
                        </span>
                        {event.status === 'closed' && (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full">
                            Closed
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-800">{event.title}</h3>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {event.event_date}
                        </span>
                        {event.location && (
                          <span className="flex items-center gap-1">
                            <MapPin size={14} />
                            {event.location}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                        <User size={14} />
                        {event.participants?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center gap-2 mb-6">
            <Users className="text-green-500" size={24} />
            <h2 className="text-xl font-bold text-gray-800">All Residents</h2>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {residents.length === 0 ? (
              <div className="text-center py-8">
                <Users className="mx-auto text-gray-300 mb-2" size={48} />
                <p className="text-gray-500">No residents yet</p>
              </div>
            ) : (
              residents.map(resident => (
                <div key={resident.id} className="flex items-center justify-between border border-gray-100 rounded-lg p-3 hover:shadow-sm transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {resident.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{resident.name}</p>
                      <p className="text-sm text-gray-500">House {resident.house_no}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">{resident.phone}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
