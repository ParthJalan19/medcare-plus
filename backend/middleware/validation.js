const Joi = require('joi');

const validateSchema = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
  if (error) {
    const errorMsg = error.details.map(d => d.message).join('. ');
    return res.status(400).json({
      success: false,
      error: errorMsg
    });
  }
  next();
};

// Validation Schemas
const schemas = {
  register: Joi.object({
    name: Joi.string().required().messages({
      'any.required': 'Name is required',
      'string.empty': 'Name cannot be empty'
    }),
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
    password: Joi.string().min(6).required().messages({
      'any.required': 'Password is required',
      'string.min': 'Password must be at least 6 characters'
    }),
    phone: Joi.string().allow('', null)
  }),

  login: Joi.object({
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required().messages({
      'any.required': 'Email is required',
      'string.email': 'Please enter a valid email address'
    })
  }),

  resetPassword: Joi.object({
    token: Joi.string().required().messages({
      'any.required': 'Reset token is required'
    }),
    password: Joi.string().min(6).required().messages({
      'any.required': 'New password is required',
      'string.min': 'New password must be at least 6 characters'
    })
  }),

  patient: Joi.object({
    name: Joi.string().required(),
    DOB: Joi.date().required(),
    gender: Joi.string().valid('male', 'female', 'other').required(),
    bloodGroup: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown').optional(),
    contact: Joi.string().required(),
    address: Joi.string().allow('', null),
    emergencyContact: Joi.string().allow('', null),
    allergies: Joi.array().items(Joi.string()).optional()
  }),

  doctor: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).optional(),
    role: Joi.string().valid('doctor').default('doctor'),
    phone: Joi.string().allow('', null),
    specialization: Joi.string().required(),
    department: Joi.string().required(), // hex ObjectId representation
    qualifications: Joi.string().required(),
    consultationFee: Joi.number().min(0).required(),
    availability: Joi.object().optional()
  }),

  appointment: Joi.object({
    patient: Joi.string().required(),
    doctor: Joi.string().required(),
    department: Joi.string().required(),
    date: Joi.date().required(),
    timeSlot: Joi.string().required(),
    reason: Joi.string().required(),
    notes: Joi.string().allow('', null)
  }),

  prescription: Joi.object({
    appointment: Joi.string().required(),
    medicines: Joi.array().items(
      Joi.object({
        name: Joi.string().required(),
        dosage: Joi.string().required(),
        duration: Joi.string().required(),
        instructions: Joi.string().required()
      })
    ).min(1).required()
  }),

  medicine: Joi.object({
    name: Joi.string().required(),
    category: Joi.string().required(),
    unit: Joi.string().required(),
    reorderThreshold: Joi.number().min(0).optional()
  }),

  inventory: Joi.object({
    medicine: Joi.string().required(),
    batchNumber: Joi.string().required(),
    quantity: Joi.number().integer().min(0).required(),
    expiryDate: Joi.date().required(),
    supplier: Joi.string().allow('', null)
  }),

  labTest: Joi.object({
    patient: Joi.string().required(),
    testType: Joi.string().required()
  }),

  bill: Joi.object({
    patient: Joi.string().required(),
    appointment: Joi.string().allow(null, ''),
    lineItems: Joi.array().items(
      Joi.object({
        description: Joi.string().required(),
        amount: Joi.number().min(0).required()
      })
    ).min(1).required()
  }),

  payment: Joi.object({
    amount: Joi.number().min(0.01).required(),
    method: Joi.string().valid('cash', 'card', 'insurance', 'other').required()
  }),

  staff: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'receptionist', 'nurse', 'lab', 'pharmacist').required(),
    phone: Joi.string().allow('', null)
  })
};

module.exports = {
  validateSchema,
  schemas
};
