import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firebaseUID: { 
    type: String, 
    required: [true, 'firebaseUID is required'], 
    unique: true 
  },
  name: { 
    type: String, 
    required: [true, 'Name is required'] 
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'], 
    unique: true 
  },
  role: { 
    type: String, 
    enum: ['Student', 'Alumni'], 
    required: [true, 'Role is required'] 
  },
  branch: { 
    type: String,
    validate: {
      validator: function(v) {
        return this.role !== 'Student' || (typeof v === 'string' && v.trim().length > 0);
      },
      message: 'Branch is required for Students'
    }
  },
  year: { 
    type: String,
    validate: {
      validator: function(v) {
        return this.role !== 'Student' || (typeof v === 'string' && v.trim().length > 0);
      },
      message: 'Year is required for Students'
    }
  },
  company: { 
    type: String,
    validate: {
      validator: function(v) {
        return this.role !== 'Alumni' || (typeof v === 'string' && v.trim().length > 0);
      },
      message: 'Company is required for Alumni'
    }
  },
  designation: { 
    type: String,
    validate: {
      validator: function(v) {
        return this.role !== 'Alumni' || (typeof v === 'string' && v.trim().length > 0);
      },
      message: 'Designation is required for Alumni'
    }
  },
  profilePhotoUrl: { 
    type: String, 
    default: '' 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

const User = mongoose.model('User', userSchema);

export default User;
