const Group = require('../models/groupModel');
const {
  search,
  getAllDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
} = require('../utils/query');

exports.search = search(Group, ['name']);

exports.getAllGroups = getAllDocuments(Group);

exports.getGroup = getDocument(Group);

exports.createGroup = createDocument(Group, ['name']);

exports.updateGroup = updateDocument(Group, ['name', 'permissions']);

exports.deleteGroup = deleteDocument(Group);
