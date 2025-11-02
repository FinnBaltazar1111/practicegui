# **PracticeGUI**
**PracticeGUI** is a GUI for [**smo-practice-server**](https://github.com/monsterdruide1/smo-practice-server).

> [!NOTE]
> Still in early development

## Usage
### Setting up your console
> [!IMPORTANT]
> * A hacked console or an emulator is required. This guide covers setting up an already hacked console that uses [**Atmosphere CFW**](https://github.com/atmosphere-nx/atmosphere/) (for setting one up, use the [**NH Switch Guide**](https://switch.hacks.guide/)).
> * A copy of Super Mario Odyssey is required (you do not need a dump of your game). Version 1.0.0 is also recommended, and if you have a higher version, it is easily & legally obtained if you have the first requirement: [**Odyssey Downgrade**](https://github.com/Istador/odyssey-downgrade). That tool is recommended because it keeps the update file intact which may become important at some point.
> * General knowledge of how to use and modify a hacked console (as in installing apps, managing game files, etc.)

1. On your hacked console, install [**SimpleModManager**](https://github.com/nadrino/SimpleModManager). It is a useful tool to manage mod installations so that you can easily toggle them on/off, and makes sure your base game doesn't get corrupted.
2. Use the [**Practice Mod generator**](https://tas.monsterdruide.one/smo-practice/) to generate a personalized copy of the [**Practice Mod**](https://github.com/fruityloops1/smo-practice) that will connect to the machine hosting the **Practice Server**.
> [!TIP]
> If you've properly port-forwarded the correct ports on the server (which is in no means recommended or tested), you could in theory TAS from anywhere and the below text would not apply to you. If you really want to do this, forward port `7902` and use your machine's public IP (or a URL that points to it) for generation. Again, this is NOT TESTED and just a plausible theory of mine.

> [!IMPORTANT]
> Assuming the tip above does not apply to you, the **Practice Mod** will look for your machine's private IP, which both (a.) is different across all Wi-Fi networks and (b.) is not globally accessible. This means that even if your machine is portable, you need to generate a different copy of the **Practice Mod** for *every* different location/network you want to TAS from (and if you don't have a portable machine, you can forget about it). If you are on a different network and the **Practice Mod** suddenly stops connecting to the server, now you know why!
3. Unzip the downloaded archive and copy the contents of the `atmosphere` directory to `[Switch SD Root]/mods/Super Mario Odyssey/Practice Mod/`.
4. From your Switch, open the **SimpleModManager** Homebrew app.
> [!CAUTION]
> If using Applet Mode to launch Homebrew apps, don't launch the Homebrew menu from Super Mario Odyssey. (Modifying the contents of a running game is a bad idea!)
5. Navigate to Super Mario Odyssey and toggle the mod called **Practice Mod**

### Setting up your server
> [!IMPORTANT]
> Make sure you follow these steps on the same machine you used in generating the **Practice Mod** copy (ie. the machine you're setting up the **Practice Server** on is the machine with the IP address you used on the [**Practice Mod generator**](https://tas.monsterdruide.one/smo-practice/))
1. Clone this repository locally
2. `cd` to the cloned directory and run `npm install`.
3. Run `npm start` to start the web app. Connect to port `3000` in a web browser to use the GUI.

From here, launch Super Mario Odyssey. Open a save file and use the D-Pad to navigate to `TAS`, and press D-Pad Right. Navigate to `Connect to server`, and press D-Pad Right. The GUI should display a connection and the buttons will unlock.

## Planned updates
In order of priority:
* Integrate with Google Sheets to allow directly loading TSV scripts
  * Add an API
  * Parse variable-metadata from TSV scripts

(If you have no idea what I'm talking about, just wait)

## Credits
Every project I used here was linked as a GitHub repo in this README at some point (I think), so credit goes to the authors of those repositories. The [**Practice Mod generator**](https://tas.monsterdruide.one/smo-practice/) was made by [**MonsterDruide1**](https://github.com/monsterdruide1/). Also credit to the authors of any packages I used.