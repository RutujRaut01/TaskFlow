const Task = require('../models/Task');
const List = require('../models/List');

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
    const { title, listId, boardId, description, priority, assignees } = req.body;

    try {
        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ message: 'List not found' });

        const task = await Task.create({
            title,
            description,
            priority,
            assignees,
            list: listId,
            board: boardId
        });

        list.tasks.push(task._id);
        await list.save();

        req.io.to(boardId).emit('task_created', task);

        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        req.io.to(task.board.toString()).emit('task_updated', task);

        res.json(task);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) return res.status(404).json({ message: 'Task not found' });

        // Remove task from list
        await List.findByIdAndUpdate(task.list, {
            $pull: { tasks: task._id }
        });

        await task.deleteOne();

        req.io.to(task.board.toString()).emit('task_deleted', req.params.id);

        res.json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
