// background.js
chrome.alarms.onAlarm.addListener((alarm) => {
    console.log("Alarm triggered:", alarm.name); 

    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png', 
        title: 'Reminder',
        message: `It's time for your task: "${alarm.name}".`,
        priority: 2
    }, (notificationId) => {
        if (chrome.runtime.lastError) {
            console.error("Notification error:", chrome.runtime.lastError);
        } else {
            console.log("Notification created with ID:", notificationId);
        }
    });
});

// Function to update the badge
function updateBadge() {
    chrome.storage.local.get(["tasks"], (result) => {
        const taskCount = result.tasks ? result.tasks.length : 0;

        chrome.action.setBadgeText({ text: taskCount > 0 ? String(taskCount) : '' });

        chrome.action.setBadgeBackgroundColor({ color: '#FF0000' });  // Red color
    });
}

updateBadge();

chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateBadge') {
        updateBadge();  
    }
});

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.tasks || changes.completedTasks)) {
        updateBadge();
    }
});

