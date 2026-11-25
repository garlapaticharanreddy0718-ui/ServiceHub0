const express = require('express');
const {
  handleGetCustomers,
  handleGetCustomerById,
  handleCreateCustomer,
  handleUpdateCustomer,
  handleDeleteCustomer,
  handleGetCustomerNotes,
  handleCreateCustomerNote,
  handleUpdateCustomerNote,
  handleDeleteCustomerNote,
} = require('../controllers/customerController');
const { requireRole } = require('../middleware/rbacMiddleware');

const router = express.Router({ mergeParams: true });

// Customer Records CRUD
router.get('/customers', handleGetCustomers);
router.post('/customers', handleCreateCustomer);
router.get('/customers/:customerId', handleGetCustomerById);
router.patch('/customers/:customerId', handleUpdateCustomer);
router.delete('/customers/:customerId', requireRole('OWNER', 'ADMIN'), handleDeleteCustomer);

// Customer Notes APIs
router.get('/customers/:customerId/notes', handleGetCustomerNotes);
router.post('/customers/:customerId/notes', handleCreateCustomerNote);
router.patch('/customers/:customerId/notes/:noteId', handleUpdateCustomerNote);
router.delete('/customers/:customerId/notes/:noteId', handleDeleteCustomerNote);

module.exports = router;
