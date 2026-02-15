const Board = require('../models/Board');
const List = require('../models/List');
const Task = require('../models/Task');

// @desc    Get user boards
// @route   GET /api/boards
// @access  Private
exports.getBoards = async (req, res) => {
    const { search, page = 1, limit = 10 } = req.query;
    const query = {
        $or: [{ user: req.user.id }, { members: req.user.id }]
    };

    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    try {
        const boards = await Board.find(query)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort({ createdAt: -1 });

        const count = await Board.countDocuments(query);

        res.json({
            boards,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Create a board
// @route   POST /api/boards
// @access  Private
exports.createBoard = async (req, res) => {
    if (!req.body.title) {
        return res.status(400).json({ message: 'Please add a title' });
    }

    try {
        const board = await Board.create({
            title: req.body.title,
            user: req.user.id,
            members: [req.user.id] // Owner is also a member
        });
        res.status(201).json(board);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get single board
// @route   GET /api/boards/:id
// @access  Private
exports.getBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id)
            .populate({
                path: 'lists',
                populate: {
                    path: 'tasks',
                    options: { sort: { position: 1 } } // Sort tasks by position
                },
                options: { sort: { position: 1 } } // Sort lists by position (schema needs position, adding fallback)
            })
            .populate('members', 'username email');

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        // Check if user is member/owner
        if (board.user.toString() !== req.user.id && !board.members.some(m => m._id.toString() === req.user.id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        res.json(board);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update board
// @route   PUT /api/boards/:id
// @access  Private
exports.updateBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedBoard = await Board.findByIdAndUpdate(req.params.id, req.body, {
            new: true
        });

        req.io.to(req.params.id).emit('board_updated', updatedBoard);

        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete board
// @route   DELETE /api/boards/:id
// @access  Private
exports.deleteBoard = async (req, res) => {
    try {
        const board = await Board.findById(req.params.id);

        if (!board) {
            return res.status(404).json({ message: 'Board not found' });
        }

        if (board.user.toString() !== req.user.id) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        // Delete associated lists and tasks
        await List.deleteMany({ board: board._id });
        await Task.deleteMany({ board: board._id });
        await board.deleteOne();

        res.json({ id: req.params.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
