const contractTransitions = {
    DRAFT: ['ACTIVE', 'CANCELLED'],
    ACTIVE: ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
    DISPUTED: ['IN_PROGRESS', 'CANCELLED'],
    COMPLETED: [],
    CANCELLED: []
}

const milestoneTransitions = {
    PENDING: ['SUBMITTED'],
    SUBMITTED: ['APPROVED', 'REJECTED', 'DISPUTED'],
    REJECTED: ['SUBMITTED'],
    DISPUTED: ['APPROVED','REJECTED'],
    APPROVED: []
}

export const transitionContract = (currentStatus, nextStatus) => {
    const allowed = contractTransitions[currentStatus]
    if(!allowed) {
        throw new Error(`Unknown contract status: ${currentStatus}`)
    }

    if(!allowed.includes(nextStatus)) {
        throw new Error(`Cannot transition contract from ${currentStatus} to ${nextStatus}`) 
    }

    return nextStatus
}

export const transitionMilestone = (currentStatus, nextStatus) => {
    const allowed = milestoneTransitions[currentStatus]

    if(!allowed) {
        throw new Error(`Unknown milestone status: ${currentStatus}`)
    }
    if(!allowed.includes(nextStatus)) {
        throw new Error(`Cannot transition milestone from ${currentStatus} to ${nextStatus}`)
    }

    return nextStatus
}