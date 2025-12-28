import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import api from '../../api';
import { FaTimes, FaCheck, FaTrash, FaUser, FaStore, FaEnvelope, FaIdBadge, FaUsersCog, FaSearch, FaSync } from 'react-icons/fa'; 
import Meta from '../../components/tapheader/Meta';
import { useSettings } from '../../context/SettingsContext'; 

const UserListScreen = () => {
  // --- State Management ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  
  // Filters & Search
  const [filterType, setFilterType] = useState('customer'); 
  const [searchQuery, setSearchQuery] = useState('')

  const navigate = useNavigate();
  const { t } = useSettings(); 
  
  const userInfo = useMemo(() => localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : null, []);

  // --- 1. & 2. Performance & Fetching Logic ---
  const fetchUsers = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await api.get('/api/users/');
        setUsers(data);
      } catch (err) {
        console.error("Fetch Error:", err);
        setError(err.response?.data?.detail || "Failed to load users");
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    if (userInfo && userInfo.isAdmin) {
        fetchUsers();
    } else {
        navigate('/login');
    }
  }, [navigate, userInfo, fetchUsers]);

  // --- Delete Handler ---
  const deleteHandler = async (id) => {
    if(window.confirm(t('confirmDeleteUser') || 'Are you sure you want to delete this user?')) {
        try {
            await api.delete(`/api/users/delete/${id}/`);
            
            setUsers(prevUsers => prevUsers.filter(user => user.id !== id));
            alert(t('userDeleted') || "User Deleted Successfully");
        } catch (error) {
            console.error(error);
            alert("Error deleting user. check console.");
        }
    }
  };

  // --- 2. Advanced Filtering (Memoized for Performance) ---
  const filteredUsers = useMemo(() => {
      return users.filter(user => {
          const matchesSearch = 
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            user.email?.toLowerCase().includes(searchQuery.toLowerCase());

          if (!matchesSearch) return false;

          const userType = user.profile?.user_type || (user.isAdmin ? 'admin' : 'customer');
          
          if (filterType === 'vendor') return userType === 'vendor';
          return userType === 'customer' || userType === 'admin'; 
      });
  }, [users, filterType, searchQuery]);

  return (
    <div className="min-h-screen pt-28 pb-10 px-4 md:px-6 bg-gray-50 dark:bg-gray-900 transition-colors duration-500">
      <Meta title={t('userList') || "Users List"} />
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
                <span className="p-3 bg-primary/10 text-primary rounded-2xl"><FaUsersCog /></span> 
                {t('usersManagement') || "Users Management"}
                {!loading && <span className="text-sm text-gray-400 font-medium">({filteredUsers.length})</span>}
            </h1>
            
            {/* refreash but*/}
            <button 
                onClick={fetchUsers} 
                className="p-3 bg-white dark:bg-white/5 rounded-xl shadow-sm hover:shadow-md transition text-gray-500 hover:text-primary"
                title="Refresh List"
            >
                <FaSync className={loading ? "animate-spin" : ""} />
            </button>
        </div>

        {/* Controls Section: Tabs & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center">
            {/* Tabs */}
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl w-full md:w-auto md:min-w-[300px]">
                <button 
                    onClick={() => setFilterType('customer')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        filterType === 'customer' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <FaUser /> {t('customers') || "Customers"}
                </button>

                <button 
                    onClick={() => setFilterType('vendor')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
                        filterType === 'vendor' 
                        ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md' 
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                    <FaStore /> {t('vendors') || "Vendors"}
                </button>
            </div>

            {/* Search Bar (New Feature) */}
            <div className="relative w-full md:flex-1">
                <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-100 dark:border-white/5 pl-10 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-primary/50 transition shadow-sm text-sm font-bold"
                />
            </div>
        </div>

        {/* Error Message */}
        {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 p-4 rounded-xl mb-6 text-center font-bold">
                {error}
            </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          </div>
        ) : (
          <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-4">
                {filteredUsers.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 font-bold bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-300">No users found</div>
                ) : (
                    filteredUsers.map((user) => (
                        <div key={user.id} className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm relative hover:shadow-md transition">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center font-black text-lg text-gray-600 dark:text-gray-300 uppercase">
                                    {user.name ? user.name[0] : 'U'}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">{user.name}</h3>
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                                        user.isAdmin ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                    }`}>
                                        {user.isAdmin ? 'Admin' : (user.profile?.user_type || 'Customer')}
                                    </span>
                                </div>
                                <button 
                                    onClick={() => deleteHandler(user.id)} 
                                    className="absolute top-5 right-5 text-red-400 hover:text-red-600 p-2 bg-red-50 dark:bg-red-900/10 rounded-lg transition"
                                >
                                    <FaTrash size={14} />
                                </button>
                            </div>

                            <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <FaEnvelope className="text-gray-400 flex-shrink-0" />
                                    <a href={`mailto:${user.email}`} className="hover:text-primary truncate">{user.email}</a>
                                </div>
                                <div className="flex items-center gap-2 font-mono text-xs">
                                    <FaIdBadge className="text-gray-400 flex-shrink-0" />
                                    <span className="truncate">ID: {user.id}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-white/5 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
                        <th className="p-6 pl-8">User</th>
                        <th className="p-6">Email</th>
                        <th className="p-6 text-center">Type</th> 
                        <th className="p-6 text-center">Admin</th>
                        <th className="p-6 text-right pr-8">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {filteredUsers.length === 0 ? (
                        <tr><td colSpan="6" className="p-10 text-center font-bold text-gray-400">No users match your search.</td></tr>
                    ) : (
                        filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition duration-200 group">
                            <td className="p-6 pl-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 uppercase shadow-sm">
                                        {user.name ? user.name[0] : 'U'}
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white">{user.name}</span>
                                </div>
                            </td>
                            <td className="p-6 font-medium text-gray-600 dark:text-gray-400">
                                <a href={`mailto:${user.email}`} className="hover:text-primary transition">{user.email}</a>
                            </td>
                            <td className="p-6 text-center">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    (user.profile?.type === 'vendor') ? 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400' : 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400'
                                }`}>
                                    {user.profile?.user_type || 'Customer'}
                                </span>
                            </td>
                            <td className="p-6 text-center">
                                {user.isAdmin 
                                    ? <FaCheck className="text-green-500 mx-auto bg-green-100 dark:bg-green-500/20 p-1 rounded-full text-xl"/> 
                                    : <FaTimes className="text-gray-300 dark:text-gray-600 mx-auto"/>
                                }
                            </td>
                            <td className="p-6 text-right pr-8">
                                <button 
                                    onClick={() => deleteHandler(user.id)} 
                                    className="text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/30 p-2.5 rounded-xl transition shadow-sm opacity-0 group-hover:opacity-100"
                                    title={t('delete')}
                                >
                                    <FaTrash size={14} />
                                </button>
                            </td>
                        </tr>
                        ))
                    )}
                </tbody>
                </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default UserListScreen;