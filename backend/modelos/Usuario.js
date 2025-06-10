const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const usuarioSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    enum: ['admin'],
    default: 'admin'
  }
}, {
  timestamps: true
});

// Método para verificar la contraseña
usuarioSchema.methods.compararPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Middleware para hashear la contraseña antes de guardar
usuarioSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método estático para inicializar el usuario por defecto
usuarioSchema.statics.inicializarUsuario = async function() {
  try {
    const usuarioExiste = await this.findOne({ username: 'planificacion_estrategica' });
    
    if (!usuarioExiste) {
      await this.create({
        username: 'planificacion_estrategica',
        password: 'gestion159',
        rol: 'admin'
      });
      console.log('Usuario por defecto creado exitosamente');
    }
  } catch (error) {
    console.error('Error al inicializar usuario por defecto:', error);
  }
};

const Usuario = mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario; 