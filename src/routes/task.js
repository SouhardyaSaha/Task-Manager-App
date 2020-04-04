const express = require('express');
const auth = require('../middlewares/auth')
const Task = require('../models/task');

const router = express.Router();

// create Task
router.post('/tasks', auth, async (req, res) => {
    // const task = new Task(req.body);
    const task = new Task({
        ...req.body,
        owner: req.user._id
    });
    try {
        await task.save();
        res.status(201).send(task);
    } catch (error) {
        res.status(500).send(error);
    }

})


// get all tasks
router.get('/tasks', auth, async (req, res) => {

    const match = {};
    if (req.query.isCompleted) {
        match.isCompleted = req.query.isCompleted === 'true';
    }

    const sort = {};
    if (req.query.sortBy) {
        const parts = req.query.sortBy.split(':');
        sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;  // -1 for descending data and 1 for asc
    }    

    try {
        // const tasks = await Task.find({ owner: req.user._id, isCompleted: req.query.isCompleted },[], {
        //     limit: parseInt(req.query.limit), // if limit is undefined then it will be ignored automatically
        //     skip: parseInt(req.query.skip),
        //     sort
        // });
        
        // res.send(tasks);

        // The Alternate...using virtual tasks field from user model
        await req.user.populate({
            path: 'tasks',
            match,
            options: {
                limit: parseInt(req.query.limit), // if limit is undefined then it will be ignored automatically
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate();

        res.send(req.user.tasks);
        

    } catch (error) {
        res.status(500).send(error.message);
    }

});

// get task by id
router.get('/tasks/:id', auth, async (req, res) => {

    const _id = req.params.id;
    try {
        const task = await Task.findOne({ _id, owner: req.user._id });
        if (!task) {
            return res.status(404).send('Not Found');
        }

        res.send(task);

    } catch (error) {
        res.status(500).send(error.message);
    }

});

router.patch('/tasks/:id', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['description', 'isCompleted'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Update Request..!!' });
    }

    try {

        const task = await Task.findOne({ _id: req.params.id, owner: req.user.id });

        if (!task) {
            return res.status(404).send();
        }

        updates.forEach((update) => task[update] = req.body[update]);
        await task.save();
        // const task = await Task.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });

        res.send(task);

    } catch (error) {
        res.status(400).send(error);
    }
});

router.delete('/tasks/:id', auth, async (req, res) => {

    try {
        const task = await Task.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
        if (!task) {
            return res.status(404).send();
        }

        res.send(task);
    } catch (error) {
        res.status(500).send();
    }

});

module.exports = router;