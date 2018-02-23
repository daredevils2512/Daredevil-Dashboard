# Installation

- Install NodeJS on your machine and locally run `npm install` while on a vpn or off school wifi in the repo root
    - This will install all the dependencies required for Daredevil Dashboard.
- Upload `DareDashboard`, `index.js` and `node_modules` (from the parent folder), and `nodejs_xxxxxx.ipk` to the `/home/admin/` folder.
    - It must be `/home/admin` or else the startup script will fail.
- Run `opkg install nodejs_xxxxx.ipk` to install NodeJS
- Install the DareDashboard startup script.
    - `chmod +x DareDashboard`
    - `cp DareDashboard /etc/init.d`
    - `/usr/sbin/update-rc.d -f DareDashboard defaults`
    - Reboot and verify it works.

# Notes

- If you ever have to modify the startup script, you need to make sure to save in ASCII.