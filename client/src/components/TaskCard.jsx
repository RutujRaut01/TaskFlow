import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2 } from 'lucide-react';

const TaskCard = ({ task, onDelete, onUpdate }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: task._id,
        data: {
            type: 'Task',
            task
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handleDelete = (e) => {
        e.stopPropagation(); // Prevent drag start when clicking delete
        // e.preventDefault(); // Might be needed
        if (window.confirm('Are you sure you want to delete this task?')) {
            onDelete(task._id);
        }
    };

    const togglePriority = (e) => {
        e.stopPropagation();
        const priorities = ['Low', 'Medium', 'High'];
        const currentIndex = priorities.indexOf(task.priority || 'Medium');
        const nextPriority = priorities[(currentIndex + 1) % 3];
        onUpdate(task._id, { priority: nextPriority });
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className="bg-white p-3 mb-2 rounded shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing group relative"
        >
            <div className="flex justify-between items-start">
                <h4 className="font-medium text-gray-800">{task.title}</h4>
                <button
                    onClick={handleDelete}
                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                >
                    <Trash2 size={16} />
                </button>
            </div>
            {task.description && (
                <p className="text-sm text-gray-500 mt-2 truncate">{task.description}</p>
            )}
            <div className="mt-2 flex gap-2">
                {task.priority && (
                    <span
                        onClick={togglePriority}
                        onPointerDown={(e) => e.stopPropagation()} // Prevent drag start
                        title="Click to change priority"
                        className={`text-xs px-2 py-1 rounded-full cursor-pointer hover:opacity-80 transition-opacity select-none ${task.priority === 'High' ? 'bg-red-100 text-red-600' :
                            task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                'bg-green-100 text-green-600'
                            }`}
                    >
                        {task.priority || 'Medium'}
                    </span>
                )}
            </div>
        </div>
    );
};

export default TaskCard;
