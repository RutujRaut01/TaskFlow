import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal, Trash2 } from 'lucide-react';
import { useState } from 'react';

const BoardColumn = ({ list, tasks, onDeleteList, onAddTask, onDeleteTask, onUpdateTask }) => {
    const { setNodeRef } = useDroppable({
        id: list._id,
        data: {
            type: 'Column',
            list
        }
    });

    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newPriority, setNewPriority] = useState('Medium');

    const [isAddingTask, setIsAddingTask] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;
        onAddTask(list._id, newTaskTitle, newPriority);
        setNewTaskTitle('');
        setNewPriority('Medium');
        setIsAddingTask(false);
    };

    const confirmDelete = () => {
        onDeleteList(list._id);
        setShowDeleteModal(false);
    };

    return (
        <div className="bg-gray-100 w-80 rounded-lg p-4 flex flex-col max-h-full mr-4 shrink-0">
            <div className="flex justify-between items-center mb-4 cursor-grab">
                <h3 className="font-bold text-gray-700">{list.title}</h3>
                <div className="flex gap-2">
                    <button onClick={() => setShowDeleteModal(true)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div ref={setNodeRef} className="flex-1 overflow-y-auto min-h-[50px]">
                <SortableContext
                    items={tasks.map((t) => t._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <TaskCard key={task._id} task={task} onDelete={onDeleteTask} onUpdate={onUpdateTask} />
                    ))}
                </SortableContext>
            </div>

            <div className="mt-4">
                {isAddingTask ? (
                    <form onSubmit={handleAddTask} className="bg-white p-2 rounded shadow-sm">
                        <input
                            type="text"
                            autoFocus
                            className="w-full border p-2 rounded mb-2 text-sm"
                            placeholder="Enter task title..."
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                        />
                        <select
                            value={newPriority}
                            onChange={(e) => setNewPriority(e.target.value)}
                            className="w-full border p-2 rounded mb-2 text-sm bg-white"
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="bg-primary-600 text-white px-3 py-1 rounded text-sm hover:bg-primary-700"
                            >
                                Add
                            </button>
                            <button
                                type="button"
                                onClick={() => setIsAddingTask(false)}
                                className="text-gray-500 px-3 py-1 rounded text-sm hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <button
                        onClick={() => setIsAddingTask(true)}
                        className="flex items-center gap-2 text-gray-600 hover:bg-gray-200 w-full p-2 rounded"
                    >
                        <Plus size={16} /> Add Card
                    </button>
                )}
            </div>
            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-80">
                        <h3 className="text-lg font-bold mb-4 text-gray-800">Delete List?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete <strong>{list.title}</strong>? All tasks in this list will be removed.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BoardColumn;
