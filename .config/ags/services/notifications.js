import Service from 'resource:///com/github/Aylur/ags/service.js';
import * as Utils from 'resource:///com/github/Aylur/ags/utils.js';

class NotificationService extends Service {
    static {
        Service.register(this, {
            'notification-added': ['string'],
        });
    }

    constructor() {
        super();
        
        // Monitor dbus for new notifications
        Utils.execAsync(['bash', '-c', `
            dbus-monitor "interface='org.freedesktop.Notifications'" | while read -r line; do
                if [[ $line == *"member=Notify"* ]]; then
                    echo "notification"
                fi
            done
        `]).then(output => {
            this.emit('notification-added', 'New notification');
        }).catch(print);
    }
}

export default new NotificationService();
