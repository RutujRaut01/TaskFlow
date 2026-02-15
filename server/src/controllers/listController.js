const List = require('../models/List');
const Board = require('../models/Board');

// @desc    Create a list
// @route   POST /api/lists
// @access  Private
exports.createList = async (req, res) => {
    const { title, boardId } = req.body;

    try {
        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ message: 'Board not found' });

        const newList = await List.create({
            title,
            board: boardId,
            tasks: []
        });

        board.lists.push(newList._id);
        await board.save();

        req.io.to(boardId).emit('list_created', newList);

        res.status(201).json(newList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a list
// @route   PUT /api/lists/:id
// @access  Private
exports.updateList = async (req, res) => {
    try {
        const updatedList = await List.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        req.io.to(updatedList.board.toString()).emit('list_updated', updatedList);

        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a list
// @route   DELETE /api/lists/:id
// @access  Private
exports.deleteList = async (req, res) => {
    try {
        const list = await List.findById(req.params.id);
        if (!list) return res.status(404).json({ message: 'List not found' });

        // Remove list from board
        await Board.findByIdAndUpdate(list.board, {
            $pull: { lists: list._id }
        });

        // Delete tasks in list (Assuming cascading delete if needed, but for now just list)
        // Actually better to delete tasks
        const Task = require('../models/Task');
        await Task.deleteMany({ list: list._id });

        await list.deleteOne();

        req.io.to(list.board.toString()).emit('list_deleted', req.params.id);

        res.json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
