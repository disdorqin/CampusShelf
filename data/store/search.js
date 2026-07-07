/**
 * Book search / category data access.
 *
 * Original version queried the Google Books API for every page load and read
 * categories from MongoDB. To make the project run locally without external
 * services, this version reads from local JSON seed files (data/store/books.json
 * and data/store/categories.json) via utilities/jsonStore.js.
 *
 * The exported function signatures (searchForBooks, searchByISBN,
 * searchByCategory, getCategories) are preserved so the routes do not change.
 */
const { v4: uuidv4 } = require('uuid');
const jsonStore = require('../../utilities/jsonStore');

const getBooks = () => jsonStore.readJson('store/books.json') || [];
const getCategoriesData = () => jsonStore.readJson('store/categories.json') || { categories: [] };

// Normalize a raw stored book into the shape the views expect.
const normalizeBook = (b) => ({
    isbn: b.isbn,
    title: b.title,
    price: b.price,
    description: b.description || '暂无简介',
    textSnippet: b.textSnippet || (b.description ? b.description.substring(0, 79) + '...' : '暂无简介'),
    imageURL: b.imageURL || { thumbnail: '' },
    authors: b.authors || 'N/A',
    publisher: b.publisher || 'N/A',
    publishedDate: b.publishedDate || 'N/A',
    pageCount: b.pageCount || 'N/A',
    categories: b.categories || [],
    averageRating: b.averageRating || 0,
    ratingsCount: b.ratingsCount || 0,
    _uuid: uuidv4()
});

const searchForBooks = async(bookTitle) => {
    if (!bookTitle) throw { "function": "searchForBooks", "error": "Missing Book title" };

    const books = getBooks();

    // "*" (used by the landing page) returns everything.
    if (bookTitle === '*') {
        return books.map(normalizeBook);
    }

    const q = bookTitle.toLowerCase();
    return books.filter(b =>
        (b.title && b.title.toLowerCase().includes(q)) ||
        (b.authors && b.authors.toLowerCase().includes(q)) ||
        (b.categories && b.categories.join(' ').toLowerCase().includes(q))
    ).map(normalizeBook);
};

const searchByISBN = async(isbn) => {
    if (!isbn) throw { "function": "searchByISBN", "error": "Missing ISBN." };

    const book = getBooks().find(b => b.isbn === isbn);
    if (!book) throw { "function": "searchByISBN", "error": "No book found for ISBN " + isbn };

    return [normalizeBook(book)];
};

const searchByCategory = async(category) => {
    if (!category) throw { "function": "searchByCategory", "error": "Missing Category" };

    const q = category.toLowerCase();
    return getBooks()
        .filter(b => b.categories && b.categories.join(' ').toLowerCase().includes(q))
        .map(normalizeBook);
};

const getCategories = async() => {
    const data = getCategoriesData();
    return data.categories || [];
};

module.exports = {
    searchForBooks: searchForBooks,
    searchByISBN: searchByISBN,
    searchByCategory: searchByCategory,
    getCategories: getCategories
};
