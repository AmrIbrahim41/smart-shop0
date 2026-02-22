import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FaSearch, FaSpinner, FaTimes, FaUserShield,
    FaUser, FaFilter, FaUsers, FaTrash, FaExclamationTriangle,
    FaStore, FaEnvelope, FaCalendarAlt
} from 'react-icons/fa';
import api from '../../api';
import toast from 'react-hot-toast';
import Meta from '../../components/tapheader/Meta';
import Paginate from '../../components/paginate/Paginate';

const UserListScreen = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [deleting, setDeleting] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const fetchUsers = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const { data } = await api.get(`/api/users/?page=${page}`);
            
            let userData = [];
            
            if (Array.isArray(data)) {
                userData = data;
            } else if (data.results && Array.isArray(data.results)) {
                userData = data.results;
                setCurrentPage(page);
                setTotalPages(Math.ceil((data.count || 0) / 10));
            } else if (data.users && Array.isArray(data.users)) {
                userData = data.users;
                setCurrentPage(data.page || 1);
                setTotalPages(data.pages || 1);
            } else {
                userData = [];
            }
            
            setUsers(userData);
        } catch (error) {
            console.error('Fetch users error:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to load users';
            toast.error(errorMsg);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers(currentPage);
    }, [fetchUsers, currentPage]);

    const handleDeleteClick = useCallback((user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!userToDelete) return;

        setDeleting(userToDelete.id || userToDelete._id);
        setShowDeleteModal(false);

        try {
            await api.delete(`/api/users/delete/${userToDelete.id || userToDelete._id}/`);
            
            toast.success('User deleted successfully!', {
                icon: '🗑️',
                duration: 2000,
            });
            
            fetchUsers(currentPage);
        } catch (error) {
            console.error('Delete user error:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to delete user';
            toast.error(errorMsg);
        } finally {
            setDeleting(null);
            setUserToDelete(null);
        }
    }, [userToDelete, currentPage, fetchUsers]);

    const handleToggleAdmin = useCallback(async (userId, currentStatus) => {
        try {
            await api.put(`/api/users/update/${userId}/`, {
                is_admin: !currentStatus
            });
            
            toast.success(`User ${!currentStatus ? 'promoted to' : 'removed from'} admin!`, {
                icon: !currentStatus ? '⬆️' : '⬇️',
                duration: 2000,
            });
            
            fetchUsers(currentPage);
        } catch (error) {
            console.error('Toggle admin error:', error);
            const errorMsg = error.response?.data?.detail || 'Failed to update user';
            toast.error(errorMsg);
        }
    }, [currentPage, fetchUsers]);

    // Filter users
    const filteredUsers = users.filter(user => {
        const matchesSearch = searchTerm === '' || 
            (user.name || user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (user.email || '').toLowerCase().includes(searchTerm.toLowerCase());

        const isAdmin = user.isAdmin || user.is_admin;
        const isVendor = user.profile?.user_type === 'vendor' || user.user_type === 'vendor';
        
        const matchesRole = filterRole === 'all' || 
            (filterRole === 'admin' && isAdmin) ||
            (filterRole === 'vendor' && isVendor) ||
            (filterRole === 'customer' && !isAdmin && !isVendor);

        return matchesSearch && matchesRole;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pt-28">
                <div className="text-center">
                    <FaSpinner className="animate-spin text-5xl text-primary mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-28 pb-12">
            <Meta title="User Management - Admin" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
                            User Management
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Monitor and manage user accounts and permissions.
                        </p>
                    </div>
                    <div className="flex items-center">
                        <span className="px-5 py-2.5 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold text-gray-900 dark:text-white border border-gray-200 dark:border-white/10 shadow-sm w-full md:w-auto text-center">
                            <span className="text-primary mr-2">{filteredUsers.length}</span> 
                            Total Users
                        </span>
                    </div>
                </motion.div>

                {/* Search and Filter Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-4 sm:p-6 mb-8"
                >
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search */}
                        <div className="flex-1 relative">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search users by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 text-gray-900 dark:text-white transition-all"
                            />
                            {searchTerm && (
                                <button 
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <FaTimes />
                                </button>
                            )}
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold transition-all active:scale-95 ${
                                showFilters
                                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                    : 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                            }`}
                        >
                            <FaFilter />
                            <span>Filters</span>
                        </button>
                    </div>

                    {/* Filter Options */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                                animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                                className="overflow-hidden border-t border-gray-100 dark:border-white/10"
                            >
                                <div className="pt-4">
                                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                                        Filter by Role:
                                    </p>
                                    <div className="grid grid-cols-2 md:flex flex-wrap gap-2">
                                        {[
                                            { value: 'all', label: 'All Users' },
                                            { value: 'admin', label: 'Admins' },
                                            { value: 'vendor', label: 'Vendors' },
                                            { value: 'customer', label: 'Customers' },
                                        ].map((filter) => (
                                            <button
                                                key={filter.value}
                                                onClick={() => setFilterRole(filter.value)}
                                                className={`px-4 py-2.5 md:py-2 rounded-xl text-sm font-bold transition-colors text-center ${
                                                    filterRole === filter.value
                                                        ? 'bg-primary text-white'
                                                        : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                                }`}
                                            >
                                                {filter.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Users Data */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    {filteredUsers.length > 0 ? (
                        <>
                            {/* Desktop View (Table) */}
                            <div className="hidden lg:block bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden mb-6">
                                <table className="w-full">
                                    <thead className="bg-gray-50 dark:bg-gray-900/50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                        {filteredUsers.map((user, index) => {
                                            const isDeleting = deleting === (user.id || user._id);
                                            const isAdmin = user.isAdmin || user.is_admin;
                                            const isVendor = user.profile?.user_type === 'vendor' || user.user_type === 'vendor';

                                            return (
                                                <motion.tr
                                                    key={user.id || user._id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: 0.05 * index }}
                                                    className={`hover:bg-gray-50/80 dark:hover:bg-white/5 transition-colors group ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                                                >
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                                                                {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-bold text-gray-900 dark:text-white">
                                                                {user.name || user.username || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {isAdmin ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                                                                <FaUserShield /> Admin
                                                            </span>
                                                        ) : isVendor ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                                                                <FaStore /> Vendor
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                                <FaUser /> Customer
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                                            {new Date(user.date_joined || user.dateJoined || Date.now()).toLocaleDateString()}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => handleToggleAdmin(user.id || user._id, isAdmin)}
                                                                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                                                                    isAdmin
                                                                        ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-500/20'
                                                                        : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20'
                                                                }`}
                                                            >
                                                                {isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(user)}
                                                                disabled={isDeleting}
                                                                className="p-2.5 bg-gray-50 dark:bg-gray-700 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                                            >
                                                                {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                                            </button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile View (Cards) */}
                            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                {filteredUsers.map((user, index) => {
                                    const isDeleting = deleting === (user.id || user._id);
                                    const isAdmin = user.isAdmin || user.is_admin;
                                    const isVendor = user.profile?.user_type === 'vendor' || user.user_type === 'vendor';

                                    return (
                                        <motion.div
                                            key={user.id || user._id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ delay: 0.05 * index }}
                                            className={`bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-5 flex flex-col gap-4 ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}
                                        >
                                            <div className="flex justify-between items-start gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center text-lg font-bold text-primary shrink-0">
                                                        {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg line-clamp-1">
                                                            {user.name || user.username || 'Unknown'}
                                                        </h3>
                                                        <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                            <FaEnvelope className="text-gray-400" />
                                                            <span className="line-clamp-1 break-all">{user.email}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between border-t border-b border-gray-100 dark:border-white/5 py-3">
                                                <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                                                    <FaCalendarAlt className="text-gray-400" />
                                                    {new Date(user.date_joined || user.dateJoined || Date.now()).toLocaleDateString()}
                                                </div>
                                                <div>
                                                    {isAdmin ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400">
                                                            <FaUserShield /> Admin
                                                        </span>
                                                    ) : isVendor ? (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">
                                                            <FaStore /> Vendor
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                                            <FaUser /> Customer
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleToggleAdmin(user.id || user._id, isAdmin)}
                                                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 ${
                                                        isAdmin
                                                            ? 'bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100'
                                                            : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100'
                                                    }`}
                                                >
                                                    {isAdmin ? 'Remove Admin' : 'Make Admin'}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(user)}
                                                    disabled={isDeleting}
                                                    className="px-4 py-2.5 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors disabled:opacity-50 flex items-center justify-center"
                                                >
                                                    {isDeleting ? <FaSpinner className="animate-spin" /> : <FaTrash />}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>

                            {/* Pagination (Common for both views) */}
                            {totalPages > 1 && (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-4 flex justify-center">
                                    <Paginate
                                        page={currentPage}
                                        pages={totalPages}
                                        onPageChange={setCurrentPage}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-16 text-center">
                            <div className="w-24 h-24 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaUsers className="text-4xl text-gray-400 dark:text-gray-500" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                No users found
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                                {searchTerm || filterRole !== 'all'
                                    ? 'We couldn\'t find any users matching your current search or filter criteria.'
                                    : 'There are no users registered in the system yet.'}
                            </p>
                        </div>
                    )}
                </motion.div>
            </div>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && userToDelete && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowDeleteModal(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-10 p-8 text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FaExclamationTriangle className="text-4xl text-red-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Delete User?
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-8">
                                Are you sure you want to delete user <span className="font-bold text-gray-900 dark:text-white">"{userToDelete.name || userToDelete.username}"</span>? This action is permanent and cannot be undone.
                            </p>
                            <div className="flex flex-col-reverse sm:flex-row gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    className="w-full sm:w-1/2 px-4 py-3.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="w-full sm:w-1/2 flex items-center justify-center gap-2 px-4 py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all active:scale-95"
                                >
                                    <FaTrash />
                                    Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default UserListScreen;