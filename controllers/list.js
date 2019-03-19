// routes for List API

module.exports.handleCreate = db => (req, res) => {
  const title = req.body.title;
  const email = req.user.email;

  // check if title exists
  if (!title)
    return res.status(400).json({
      success: false,
      message: 'Missing title'
    });

  // add list to database
  db.insert({ title })
    .into('lists')
    .returning('*')
    .then(list => {
      return res.status(201).json({
        success: true,
        list: list[0]
      });
    })
    .catch(err => {
      return res.status(500).json({
        success: false,
        message: 'Failed to create list'
      });
    });
};

module.exports.handleGetAll = db => (req, res) => {
  // return all the lists
  db.select('id', 'title')
    .from('lists')
    .where(email, req.user.email)
    .then(lists => {
      return res.status(200).json({
        success: true,
        lists: lists
      });
    });
};

module.exports.handleGet = db => (req, res) => {
  // build list and return if it belongs to user
  db.select('id', 'title')
    .from('lists')
    .where(email, req.user.email)
    .then(list => {
      // check if list was found
      if (list.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'List not found'
        });
      } else {
        // get all the items for the list
        db.select('id', 'title', 'complete')
          .from('items')
          .where('id', list[0].id)
          .then(items => {
            return res.status(200).json({
              success: true,
              list: { id, title, items }
            });
          });
      }
    })
    .catch(err => {
      return res.status(500).json({
        success: false,
        message: 'Error getting list'
      });
    });
};

module.exports.handleUpdate = db => (req, res) => {
  const { title } = req.body;
  if (!title)
    return res.status(400).json({
      success: false,
      message: 'Missing title'
    });
  db('lists')
    .where('owner', req.user.email)
    .where('id', req.params.id)
    .update({ title: req.body.title })
    .returning(['id', 'title', 'owner'])
    .then(list => {
      if (list.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'List not found'
        });
      } else {
        return res.status(200).json({
          success: true,
          list: list[0]
        });
      }
    })
    .catch(err =>
      res.status(500).json({
        success: false,
        message: 'Failed to update list'
      })
    );
};

module.exports.handleAddItem = db => (req, res) => {
  const { listId, title, complete } = req.body;
  if (!listId)
    return res.status(400).json({
      success: false,
      message: 'Missing listId'
    });
  if (!title)
    return res.status(400).json({
      success: false,
      message: 'Missing title'
    });
  if (!complete)
    return res.status(400).json({
      success: false,
      message: 'Missing complete'
    });
  db.select('id')
    .from('lists')
    .where('owner', req.user.email)
    .then(list => {
      if (list.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'List not found'
        });
      } else {
        db.insert({ list: listId, title, complete })
          .into('items')
          .returning('*')
          .then(item => {
            return res.status(201).json({
              success: true,
              item: item[0]
            });
          });
      }
    })
    .catch(err =>
      res.status(500).json({
        success: false,
        message: 'Failed to add item'
      })
    );
};

module.exports.handleUpdateItem = db => (req, res) => {
  const { title, complete } = req.body;
  const itemId = req.params.id;
  if (!title)
    return res.status(400).json({
      success: false,
      message: 'Missing title'
    });
  if (!complete)
    return res.status(400).json({
      success: false,
      message: 'Missing complete'
    });
  db.select('*')
    .from('items')
    .where('id', itemId)
    .then(item => {
      if (item.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Failed to get item'
        });
      } else {
        db.select('owner')
          .from('lists')
          .where('id', item[0].list)
          .then(list => {
            if (list.length === 0) {
              return res.status(500).json({
                success: false,
                message: 'Failed to get list'
              });
            } else if (list[0] !== req.user.email) {
              return res.status(400).json({
                success: false,
                message: 'Item not found'
              });
            } else {
              db('items')
                .where('id', itemId)
                .update({ title, complete })
                .returning('*')
                .then(item => {
                  return res.status(200).json({
                    success: true,
                    message: 'Successfully updated item'
                  });
                });
            }
          });
      }
    })
    .catch(err =>
      res.status(500).json({
        success: false,
        message: 'Failed to update item'
      })
    );
};

module.exports.handleDeleteItem = db => (req, res) => {
  db.select('list')
    .from('items')
    .where('id', req.params.id)
    .then(item => {
      if (item.length === 0) {
        return res.status(500).json({
          sucess: false,
          message: 'Failed to get item'
        });
      } else {
        db.select('owner')
          .from('lists')
          .where('id', item[0])
          .then(list => {
            if (list.length === 0) {
              return res.status(500).json({
                sucess: false,
                message: 'Failed to get list'
              });
            } else if (list[0] !== req.user.email) {
              return res.status(400).json({
                sucess: false,
                message: 'Item not found'
              });
            } else {
              db('items')
                .where('id', req.params.id)
                .del()
                .then(num => {
                  return res.status(200).json({
                    success: true,
                    message: 'Successfully deleted item'
                  });
                });
            }
          });
      }
    })
    .catch(err => {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete item'
      });
    });
};

module.exports.handleDeleteList = db => (req, res) => {
  db.select('owner')
    .from('lists')
    .where('id', req.params.id)
    .then(list => {
      if (list.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'List not found'
        });
      } else {
        db('items')
          .where('list', list[0].id)
          .del()
          .then(num => {
            db('lists')
              .where('id', req.params.id)
              .del()
              .then(num => {
                if (num > 0) {
                  return res.status(200).json({
                    success: true,
                    message: 'Successfully deleted list'
                  });
                } else {
                  return res.status(500).json({
                    success: false,
                    message: 'Failed to delete list'
                  });
                }
              });
          });
      }
    })
    .catch(err =>
      res.status(500).json({
        success: false,
        message: 'Failed to delete list'
      })
    );
};
