const express = require('express');
const User = require('../models/user');
const auth = require('../middlewares/auth');
const multer = require('multer');
const sharp = require('sharp');

const router = express.Router();

// register User
router.post('/users', async (req, res) => {
    const user = new User(req.body);

    try {
        await user.save();
        const token = await user.generateAuthToken();

        res.status(201).send({ user, token });
    } catch (error) {
        res.status(400).send(error);
    }


});

// login user
router.post('/users/login', async (req, res) => {

    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();

        res.send({ user, token });
    } catch (error) {
        if (error.message) {
            return res.status(400).send(error.message);
        }
        res.status(400).send(error);
    }

});

// Logout User
router.post('/users/logout', auth, async (req, res) => {

    try {
        req.user.tokens = req.user.tokens.filter((token) => token.token !== req.token);
        await req.user.save();

        res.send('Logged Out..!!');
    } catch (error) {
        res.send(error);
    }

});

// logout of all the devices
router.post('/users/logoutALL', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        res.send('Logged Out of All Sessions');
    } catch (error) {
        res.send(error);
    }
})

// read User profile
router.get('/users/me', auth, async (req, res) => {

    try {
        res.send(req.user);
    } catch (error) {
        res.status(500).send(error);
    }

});

// Update User
router.patch('/users/me', auth, async (req, res) => {

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'age', 'email', 'password'];
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {

        return res.status(400).send({ error: 'Invalid Requests..!!!' });
    }

    try {

        updates.forEach((update) => req.user[update] = req.body[update]);
        await req.user.save();

        // this next line by passes the mongoose middleware save event...so it is replaced by the upper 3 codes

        // const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        res.send(req.user);
    } catch (error) {
        // validation error
        res.status(400).send(error);
    }


});

router.delete('/users/me', auth, async (req, res) => {
    try {
        await req.user.remove();
        res.send(req.user);
    } catch (error) {
        res.send(error);
    }
});

// const acceptedUploadExtensions = [pdf];
const upload = multer({
    // the property can't be use when we try to access the file from the fucntion and save it to the database 
    // By not using it a file property is passed to the req 
    // dest: 'images', 

    limits: {
        fileSize: 1000000
    },
    fileFilter(req, file, cb) {
        if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
            cb(new Error('Please upload a image'));
        }

        cb(undefined, true);
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {

    //<img src="data:image/jpg;base64,THE-BINARY-DATA-FROM-THE-DATABASE> in html
    const buffer = await sharp(req.file.buffer).resize(250, 250).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => { // for getting the error from the multer middleware
    res.status(400).send(error.message);
});


router.delete('/users/me/avatar', auth, async (req, res) => {

    req.user.avatar = undefined;
    await req.user.save();

    res.send('Avatar Removed')

});

router.get('/users/:id/avatar', async (req, res) => {

    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/png').send(user.avatar);

    } catch (error) {
        res.send(400).send();
    }

})

module.exports = router;