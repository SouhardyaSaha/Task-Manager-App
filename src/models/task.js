const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    description: {
        type: String,
        trim: true,
        required: true
    },
    isCompleted: {
        type: Boolean,
        default: false
    }, 
    owner: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true

    }
}, {
    timestamps: true
});

taskSchema.pre('save', function (next) {  
    
    next();
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;