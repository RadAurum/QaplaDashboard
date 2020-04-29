import { database } from './firebase';

const eventsRef = database.ref('/eventosEspeciales').child('eventsData');
const gamesRef = database.ref('/GamesResources');
const eventsParticipantsRef = database.ref('/EventParticipants');
const PlatformsRef = database.ref('/PlatformsResources');
const usersRef = database.ref('/Users');
const transactionsRef = database.ref('/Transactions');

/**
 * Returns the events ordered by their dateUTC field
 */
export async function loadEventsOrderByDate() {
    return await eventsRef.orderByChild('dateUTC').once('value');
}

/**
 * Save an event on the database
 * @param {object} eventData Data of the event to create
 * @param {function} onFinished Callback called when the event is created
 */
export function createEvent(eventData, onFinished) {
    const eventKey = eventsRef.push().key;
    eventData.idLogro = eventKey;
    eventsRef.child(eventKey).update(eventData, (error) => onFinished(error, eventKey));
}

/**
 * Update an event with eventId
 * @param {string} eventId Event identifier
 * @param {object} eventData Data of the event to update
 * @param {function} onFinished Callback called when the event is updated
 */
export function updateEvent(eventId, eventData, onFinished) {
    eventsRef.child(eventId).update(eventData, onFinished);
}

/**
 * Delete an event from the database
 * @param {string} eventId Event identifier
 * @param {function} onFinished Callback called when the event is deleted
 */
export function deleteEvent(eventId, onFinished) {
    eventsRef.child(eventId).remove(onFinished);
}

/**
 * Load all the games ordered by platform from GamesResources
 * database node
 */
export async function loadQaplaGames() {
    return (await gamesRef.once('value')).val();
}

/**
 * Get the ranking of the given event
 * @param {string} eventId Event identifier
 * @returns {Array} Array of users object with fields
 * { uid, winRate, victories, matchesPlayed, userName, gamerTag } <- For user
 */
export async function getEventRanking(eventId) {
    /**
     * Get only participants with at least one match played
     */
    const rankedUsersObject = await eventsParticipantsRef.child(eventId).orderByChild('matchesPlayed').startAt(1).once('value');

    if (rankedUsersObject.val()) {
        /**
         * Sort the users based on their points and winRate
         */
        return Object.keys(rankedUsersObject.val()).map((uid) => {
            const rankedUser = rankedUsersObject.val()[uid];
            rankedUser.winRate = rankedUser.victories / rankedUser.matchesPlayed;
            rankedUser.uid = uid;

            return rankedUser;
        })

        /**
         * This sort can lead to bugs in the future, check the cloud function onEventStatusChange
         * for a reference
         */
        .sort((a, b) => (b.priceQaploins + b.winRate) - (a.priceQaploins + a.winRate));
    }

    return [];
}

/**
 * Get the ranking of the given event
 * @param {string} eventId Event identifier
 * @returns {Object} Object of users object with fields
 * { uid, winRate, victories, matchesPlayed, userName, gamerTag } <- For every user
 */
export async function getEventParticipants(eventId) {
    /**
     * Get only participants with at least one match played
     */
    return (await eventsParticipantsRef.child(eventId).once('value')).val();
}

/**
 * Load all the platforms from PlatformsResources
 * database node
 */
export async function loadQaplaPlatforms() {
    return (await PlatformsRef.once('value')).val();
}

/**
 * Add any amount of Qoins to multiple users in one transaction
 *
 * @param {array} transactionArray Array of objects with the following shape [ {uid, qoins, ...}, {uid, qoins, ...} ]
 * @example addDifferentQuantityOfQoinsToMultipleUsers([ {uid: 'dkd', qoins: 50, userName: 'd'}, {uid: 'nufidb', qoins: 100, userName: 'g'} ])
 */
export async function addDifferentQuantityOfQoinsToMultipleUsers(transactionArray) {
    try {
        let updateUsers = {};

        for (let i = 0; i < transactionArray.length; i++) {
            const userQoins = await getUserQoins(transactionArray[i].uid);
            updateUsers[`/${transactionArray[i].uid}/credits`] = userQoins.val() + transactionArray[i].qoins;
            recordQaploinTransaction(transactionArray[i].uid, transactionArray[i].qoins, 'Event Prize');
        }

        usersRef.update(updateUsers);
    }
    catch(error) {
        console.error('[Add Different Quantity Of Qoins To Multiple Users]', error);
    }
}

/**
 * Return the current amount of qaploins of specific user
 * @param {string} uid User identifier of firebase node
 */
async function getUserQoins(uid) {
    try {
        return await usersRef.child(uid).child('credits').once('value');
    } catch(error) {
        console.error('[Get User Qaploins]', error);
    }
}

/**
 * Create a transaction record on database
 * @param {string} uid Unique id of the user
 * @param {number} quantity Number of qaploins
 * @param {string} concept concept of the transaction
 */
async function recordQaploinTransaction(uid, quantity, concept) {
    var today = new Date();

    // Fill date information
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0');
    var yyyy = today.getFullYear();
    var hour = today.getHours();
    var minutes = today.getMinutes();
    // Build today date with previous filled information
    today = mm + '/' + dd + '/' + yyyy + ' ' + hour + ':' + minutes;
    const transaction = {
        date: today,
        concept,
        quantity,
        isServer: true
    };

    try {
        return transactionsRef.child(uid).push(transaction);
    } catch (error) {
        console.error('[Record Qaploin Transaction]', error);
    }
}