var pg = require('pg');

var database_url = process.env.DATABASE_URL || 'postgres://udkegzydszxlfg:abUNsyD0aHQV6KuVzDw2QUkNBN@ec2-54-83-204-244.compute-1.amazonaws.com:5432/d91a04g4tcaahe?ssl=true&pool=true';


exports.addCustomer = function (name, email , username , password, callback) { //Improvement to do: encapsulate in transaction
    pg.connect(database_url , function (err, client, done) {
        if (err) {
            callback({ error: 'Failed to connect to database' }, null);
        }
        else {

            client.query({ text: "INSERT INTO person(username,password) VALUES( $1, $2) RETURNING personId", name: 'insert person', values: [username,password] }, function (err, result) {
                if (err) {
                    if (err.code == 23505) //username already exists (unique key constraint code)
                        callback({ error: "Username already exists" }, null);
                }
                else {
                    var id = result.rows[0].personid;

                    client.query({ text: "INSERT INTO customer(customerId,name,email) VALUES( $1, $2, $3)", name: 'insert customer', values: [id, name, email] }, function (err, result) {
                        if (err) callback({ error: err }, null);
                        else {
                            callback(null, {name: name, email: email, username: username, password: password});

                        }
                    });

                }
            });
        }

        done();
    });

}

exports.changePassword = function (username, newPassword, callback) {
    pg.connect(database_url , function (err, client, done) {
        if (err) {
            callback({ error: 'Failed to connect to database' }, null);
        }
        else {
            client.query({ text: "UPDATE person SET password=$2 WHERE username=$1", name: 'update person', values: [username, newPassword] }, function (err, result) {

            });
        }

        done();
    });

}

exports.deleteAccount = function (username, callback) {
    pg.connect(database_url , function (err, client, done) {
        if (err) {
            callback({ error: 'Failed to connect to database' }, null);
        }
        else {
            client.query({ text: "DELETE FROM person WHERE username=$1", name: 'delete person', values: [username] }, function (err, result) {

            });
        }

        done();
    });

}

exports.addOrder = function (ready, cartid, productid, quantity, callback) {
    pg.connect(database_url , function (err, client, done) {
        if (err) {
            callback({ error: 'Failed to connect to database' }, null);
        }
        else {
            client.query({ text: "INSERT INTO orders(ready, cartid, productid, quantity) VALUES($1, $2, $3, $4)", name: 'insert orders', values: [ready, cartid, productid, quantity] }, function (err, result) {

            });
        }

        done();
    });
    
}

function getCustomerManagerData(client, id, callback) {
    
    
    client.query({ text: "SELECT * FROM customer WHERE customerid = $1", name: 'get customer', values: [id] }, function (err, result) {
        if (err) callback(err, null);
        else {
            var customer = result.rows[0];
            
            if (customer) {
                delete customer.customerid;
                callback(null, customer);
            }
            else {
                client.query({ text: "SELECT * FROM worker WHERE workerid = $1", name: 'get worker', values: [id] }, function (err, result) {
                    if (err) callback(err, null);
                    else {
                        var worker = result.rows[0];
                        
                        if (worker) {
                            delete worker.workerid;
                            callback(null, worker);
                        }
                        else callback("person not customer nor worker", null);

                    }
                });
            }

        }
    });
    
}    

exports.getIncomingOrders = function (establishmentId, callback) {

    pg.connect(database_url , function (err, client, done) {
        if (err) {
            callback({ error: 'Failed to connect do database' }, null);
        }
        else {
            client.query({ text: "SELECT *, product.name as productname FROM orders, cart, establishment, product WHERE orders.cartid = cart.cartid AND cart.establishmentid = establishment.establishmentid AND orders.productid = product.productid AND cart.establishmentid = $1 AND orders.orderstate != 'delivered'  ORDER BY orders.orderstime", name: 'getincomingorders', values: [establishmentId] }, function (err, result) {
            if (err) {
                //any specific error?
                callback({ error: "Error occurred" }, null);
            }
          else {
            callback(null, result.rows);
            }
          });
        }
        
        done();
    });
}