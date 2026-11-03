const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const Mainloop = imports.mainloop;
const Util = imports.misc.util;
const GLib = imports.gi.GLib;

class B4Applet extends Applet.TextIconApplet {

    constructor(metadata, orientation, panelHeight, instanceId) {
        super(orientation, panelHeight, instanceId);

        this.set_applet_icon_name("system-run");
        this.set_applet_label("B4");

        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this.statusItem = new PopupMenu.PopupMenuItem("Статус...");
        this.menu.addMenuItem(this.statusItem);

        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        let startItem = new PopupMenu.PopupMenuItem("Запустить");
        startItem.connect('activate', () => {
            Util.spawnCommandLine("sudo systemctl start b4");
            Mainloop.timeout_add_seconds(1, () => {
                this.updateStatus();
                return false;
            });
        });

        this.menu.addMenuItem(startItem);

        let stopItem = new PopupMenu.PopupMenuItem("Остановить");
        stopItem.connect('activate', () => {
            Util.spawnCommandLine("sudo systemctl stop b4");
            Mainloop.timeout_add_seconds(1, () => {
                this.updateStatus();
                return false;
            });
        });

        this.menu.addMenuItem(stopItem);

        this.updateStatus();

        this.timer = Mainloop.timeout_add_seconds(5, () => {
            this.updateStatus();
            return true;
        });
    }

    on_applet_clicked() {
        this.menu.toggle();
    }

    updateStatus() {
        try {
            let [ok, out] = GLib.spawn_command_line_sync("sudo systemctl is-active b4");
            let status = out.toString().trim();

            if (status === "active") {
                this.statusItem.label.text = "Статус: Запущен";
                this.set_applet_icon_name("media-playback-start");
            } else {
                this.statusItem.label.text = "Статус: Остановлен";
                this.set_applet_icon_name("media-playback-stop");
            }
        } catch(e) {
            this.statusItem.label.text = "Ошибка";
        }
    }

    on_applet_removed_from_panel() {
        if (this.timer)
            Mainloop.source_remove(this.timer);
    }
}

function main(metadata, orientation, panelHeight, instanceId) {
    return new B4Applet(metadata, orientation, panelHeight, instanceId);
}
