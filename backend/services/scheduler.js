const Meeting = require("../models/Meeting");

async function scheduleMeeting(employeeId, managerId, startTime){

    const start = new Date(startTime);
    const end = new Date(start.getTime() + 30 * 60000); // 30 minutes meetingDuration

    const conflict = await Meeting.findOne({
        $or: [{ employeeId }, { managerId }],
        startTime: { $lt: end },
        endTime: { $gt: start }
    });

    if (conflict) {
        throw new Error("Time slot conflict");
    }

    return await Meeeting.create({
        employeeId,
        managerId,
        startTime: start,
        endTime: end,
        status: "scheduled"
    });
}

module.exports = scheduleMeeting;