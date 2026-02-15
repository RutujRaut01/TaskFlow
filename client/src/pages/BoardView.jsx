import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable';
import BoardColumn from '../components/BoardColumn';
import TaskCard from '../components/TaskCard';
import { useSocket } from '../context/SocketContext';
import { Loader2, Plus } from 'lucide-react';

const BoardView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const socket = useSocket();
    const [board, setBoard] = useState(null);
    const [lists, setLists] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTask, setActiveTask] = useState(null); // For DragOverlay
    const [isAddingList, setIsAddingList] = useState(false);
    const [newListTitle, setNewListTitle] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Sensors for DnD
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5 // Require 5px movement to start drag (prevents accidental clicks)
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    // Fetch Board Data
    useEffect(() => {
        fetchBoard();
    }, [id]);

    // Socket Updates
    useEffect(() => {
        if (!socket || !board) return;

        socket.emit('join_board', id);

        socket.on('board_updated', (updatedBoard) => {
            setBoard(updatedBoard);
            // We might need to fetch lists/tasks again if structure changed drastically, 
            // but hopefully we get separate events for list/task updates.
            // For now, re-fetch to be safe or update state if payload is full.
            // Actually board update usually just changes title.
        });

        socket.on('list_created', (newList) => {
            setLists((prev) => [...prev, newList]);
        });

        socket.on('list_updated', (updatedList) => {
            setLists((prev) => prev.map((l) => (l._id === updatedList._id ? updatedList : l)));
        });

        socket.on('list_deleted', (listId) => {
            setLists((prev) => prev.filter((l) => l._id !== listId));
        });

        socket.on('task_created', (newTask) => {
            setTasks((prev) => [...prev, newTask]);
        });

        socket.on('task_updated', (updatedTask) => {
            setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
        });

        socket.on('task_deleted', (taskId) => {
            setTasks((prev) => prev.filter((t) => t._id !== taskId));
        });

        return () => {
            socket.off('board_updated');
            socket.off('list_created');
            socket.off('list_updated');
            socket.off('list_deleted');
            socket.off('task_created');
            socket.off('task_updated');
            socket.off('task_deleted');
        };
    }, [socket, id, board]);

    const fetchBoard = async () => {
        try {
            const res = await axios.get((import.meta.env.VITE_API_BASE_URL || '/api') + `/boards/${id}`);
            setBoard(res.data);
            setLists(res.data.lists || []);
            // Flatten tasks from lists for easier state management, or keep them nested?
            // The API returns lists populated with tasks.
            // Let's flatten tasks to a single array for dnd-kit filtering.
            const allTasks = res.data.lists.flatMap(l => l.tasks).map(t => ({ ...t, listId: t.list || res.data.lists.find(l => l.tasks.some(task => task._id === t._id))?._id }));
            // Note: The API verify population. 
            // In boardController: populate({ path: 'lists', populate: { path: 'tasks' } })
            // tasks have `list` field which is ID.
            setTasks(allTasks);
            setLoading(false);
        } catch (error) {
            console.error(error);
            // navigate('/dashboard');
            setLoading(false);
        }
    };

    const handleDragStart = (event) => {
        const { active } = event;
        const task = tasks.find((t) => t._id === active.id);
        if (task) setActiveTask(task);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the containers
        const activeTask = tasks.find((t) => t._id === activeId);
        if (!activeTask) return; // Dragging something else?

        const overTask = tasks.find((t) => t._id === overId);

        // If over item is a task, find its list. If it's a column, it's the list itself.
        let overListId;
        if (overTask) {
            overListId = overTask.list; // `list` is mostly ObjectId string in client tasks because of population? 
            // Wait, in `fetchBoard` I structured tasks. 
            // `task.list` from mongoose populate might be the ID if I didn't populate it deeper, or object.
            // My controller: `populate({ path: 'lists', populate: { path: 'tasks' } })`. 
            // Task model has `list` ref. But when populated inside List.tasks, standard Mongoose might not populate the `list` field on the Task itself unless requested.
            // So `task.list` on the client might be just the ID string if it exists, or undefined if not selected.
            // However, I can infer list from the column I'm over.
            // Let's rely on finding the task and checking.

            // Actually, easiest way is to know which list the `overId` belongs to.
            overListId = overTask.list; // Assuming string ID.
        } else {
            // Over a column
            const overList = lists.find(l => l._id === overId);
            if (overList) overListId = overList._id;
        }

        if (!overListId) return;

        // If moving to a different list
        if (activeTask.list !== overListId) {
            setTasks((prev) => {
                const activeIndex = prev.findIndex((t) => t._id === activeId);
                // Clone
                const newTasks = [...prev];
                if (activeIndex >= 0) {
                    newTasks[activeIndex] = { ...newTasks[activeIndex], list: overListId };
                }
                return newTasks;
            });
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveTask(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const task = tasks.find((t) => t._id === activeId);
        if (!task) return;

        // Determine target list
        let overListId;
        const overTask = tasks.find((t) => t._id === overId);
        if (overTask) {
            overListId = overTask.list;
        } else {
            const overList = lists.find(l => l._id === overId);
            if (overList) overListId = overList._id;
        }

        if (overListId) {
            // Move to new position locally
            // Then call API
            // For simplicity, just update the list ID and let user sort later?
            // Or handle reordering. Reordering requires sending new position/index.

            // Update task with new list ID
            if (task.list !== overListId) {
                // Moved to new list
                try {
                    await axios.put((import.meta.env.VITE_API_BASE_URL || '/api') + `/tasks/${task._id}`, {
                        listId: overListId // Update DB
                    });
                    // State is largely updated by optimistic dragOver or socket event
                } catch (err) {
                    console.error(err);
                }
            }
        }
    };

    const createList = async () => {
        if (!newListTitle.trim()) return;
        try {
            await axios.post((import.meta.env.VITE_API_BASE_URL || '/api') + '/lists', {
                title: newListTitle,
                boardId: id
            });
            setNewListTitle('');
            setIsAddingList(false);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAddTask = async (listId, title, priority) => {
        try {
            await axios.post((import.meta.env.VITE_API_BASE_URL || '/api') + '/tasks', {
                title,
                listId,
                boardId: id,
                priority // Send selected priority
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteList = async (listId) => {
        try {
            await axios.delete((import.meta.env.VITE_API_BASE_URL || '/api') + `/lists/${listId}`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            await axios.delete((import.meta.env.VITE_API_BASE_URL || '/api') + `/tasks/${taskId}`);
        } catch (err) {
            console.error(err);
        }
    };

    const handleUpdateTask = async (taskId, updates) => {
        try {
            await axios.put((import.meta.env.VITE_API_BASE_URL || '/api') + `/tasks/${taskId}`, updates);
            // Socket will handle the state update
        } catch (err) {
            console.error(err);
        }
    };

    const confirmDeleteBoard = async () => {
        try {
            await axios.delete((import.meta.env.VITE_API_BASE_URL || '/api') + `/boards/${id}`);
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Failed to delete board');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin text-primary-500" size={48} />
        </div>
    );

    if (!board) return <div className="text-center mt-10">Board not found</div>;

    return (
        <div className="h-screen flex flex-col bg-background">
            {/* Header */}
            <div className="bg-white shadow p-4 flex justify-between items-center shrink-0">
                <h1 className="text-xl font-bold text-gray-800">{board.title}</h1>
                <div className="flex gap-4">
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="text-red-500 hover:text-red-700 flex items-center gap-2 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                        title="Delete Board"
                    >
                        <Trash2 size={18} />
                        <span className="text-sm font-medium">Delete</span>
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-primary-600 font-medium">
                        Back to Dashboard
                    </button>
                </div>
            </div>

            {/* Board Canvas */}
            <div className="flex-1 overflow-x-auto p-6">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                >
                    <div className="flex h-full items-start">
                        {lists.map((list) => (
                            <BoardColumn
                                key={list._id}
                                list={list}
                                tasks={tasks.filter((t) => t.list === list._id)}
                                onAddTask={handleAddTask}
                                onDeleteList={handleDeleteList}
                                onDeleteTask={handleDeleteTask}
                                onUpdateTask={handleUpdateTask}
                            />
                        ))}

                        {isAddingList ? (
                            <div className="w-80 bg-gray-100 rounded-lg p-4 shrink-0 shadow border border-gray-300 h-fit">
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Enter list title..."
                                    className="w-full px-3 py-2 border rounded mb-2 focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                    value={newListTitle}
                                    onChange={(e) => setNewListTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') createList();
                                        if (e.key === 'Escape') setIsAddingList(false);
                                    }}
                                />
                                <div className="flex gap-2 items-center">
                                    <button
                                        onClick={createList}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded shadow-sm text-sm font-semibold"
                                    >
                                        Add List
                                    </button>
                                    <button
                                        onClick={() => setIsAddingList(false)}
                                        className="text-gray-600 hover:text-gray-900 p-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsAddingList(true)}
                                className="w-80 bg-white/50 hover:bg-white/80 rounded-lg p-4 text-gray-700 flex items-center gap-2 shrink-0 transition-colors"
                            >
                                <Plus size={20} /> Add another list
                            </button>
                        )}
                    </div>

                    <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.5' } } }) }}>
                        {activeTask ? <TaskCard task={activeTask} /> : null}
                    </DragOverlay>

                </DndContext>
            </div>

            {/* Board Delete Modal */}
            {
                showDeleteModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                            <h3 className="text-xl font-bold mb-4 text-gray-800">Delete Board?</h3>
                            <p className="text-gray-600 mb-6">
                                Are you sure you want to delete <strong>{board.title}</strong>? This action cannot be undone and all lists/tasks will be lost.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
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
                )
            }
        </div >
    );
};

export default BoardView;
