const searchData = require('./store/search');
const userData = require('./users/user');
const resourceData = require('./resources/resource');
const commentData = require('./comments/comment');
const orderData = require('./orders/order');
const wantedData = require('./wanted/wanted');

module.exports = {
    search: searchData,
    users: userData,
    resources: resourceData,
    comments: commentData,
    orders: orderData,
    wanted: wantedData
}
