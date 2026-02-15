import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plus, Trash2 } from 'lucide-react';

const Dashboard = () => {
    const [boards, setBoards] = useState([]);
    const [newBoardTitle, setNewBoardTitle] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [boardToDelete, setBoardToDelete] = useState(null);
    const { logout, user } = useAuth();

    useEffect(() => {
        fetchBoards();
    }, [page, search]); // Re-fetch on page or search change

    const fetchBoards = async () => {
        try {
            const res = await axios.get(`http://localhost:5000/api/boards?page=${page}&search=${search}`);
            setBoards(res.data.boards);
            setTotalPages(res.data.totalPages);
        } catch (error) {
            console.error(error);
        }
    };

    const createBoard = async (e) => {
        e.preventDefault();
        if (!newBoardTitle) return;

        try {
            const res = await axios.post('http://localhost:5000/api/boards', {
                title: newBoardTitle
            });
            // Refresh boards
            fetchBoards();
            setNewBoardTitle('');
        } catch (error) {
            console.error(error);
        }
    };

    const promptDelete = (e, board) => {
        e.preventDefault();
        e.stopPropagation();
        setBoardToDelete(board);
        setShowDeleteModal(true);
    };

    const confirmDeleteBoard = async () => {
        if (!boardToDelete) return;
        try {
            await axios.delete(`http://localhost:5000/api/boards/${boardToDelete._id}`);
            fetchBoards();
            setShowDeleteModal(false);
            setBoardToDelete(null);
        } catch (error) {
            console.error(error);
            alert('Failed to delete board');
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <nav className="bg-white shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-primary-600 flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    TaskFlow
                </h1>
                <div className="flex items-center gap-4">
                    <span className="text-gray-600">Welcome, {user?.username}</span>
                    <button onClick={logout} className="text-red-500 hover:underline">
                        Logout
                    </button>
                </div>
            </nav>

            <div className="container mx-auto p-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Your Boards</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search boards..."
                            className="border p-2 rounded"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Create Board Section */}
                {/* Create Board Section */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 max-w-2xl mx-auto">
                    <h3 className="text-lg font-semibold mb-4 text-gray-800">Create New Board</h3>
                    <form onSubmit={createBoard} className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Enter board title..."
                            className="flex-1 border border-gray-300 px-4 py-2 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            value={newBoardTitle}
                            onChange={(e) => setNewBoardTitle(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newBoardTitle.trim()}
                            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium transition-colors shadow-sm"
                        >
                            <Plus size={20} /> Create
                        </button>
                    </form>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">


                    {/* Board List */}
                    {boards.map((board) => (
                        <Link
                            to={`/board/${board._id}`}
                            key={board._id}
                            className="bg-white p-6 rounded shadow-md hover:shadow-lg transition-shadow cursor-pointer block"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold text-gray-800 truncate flex-1">
                                    {board.title}
                                </h3>
                                <button
                                    onClick={(e) => promptDelete(e, board)}
                                    className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                                    title="Delete Board"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                            <p className="text-gray-500 text-sm">
                                Created: {new Date(board.createdAt).toLocaleDateString()}
                            </p>
                        </Link>
                    ))}
                </div>

                {/* Pagination */}
                <div className="flex justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 bg-white border rounded disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2">Page {page} of {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 bg-white border rounded disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            </div>
            {/* Delete Board Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-xl font-bold mb-4 text-gray-800">Delete Board?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{boardToDelete?.title}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setBoardToDelete(null); }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteBoard}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Delete Board
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
