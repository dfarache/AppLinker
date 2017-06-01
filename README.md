# App Linker
## An extension for Qlik Sense

App Linker is an extension for Qlik Sense that transfers selections between applications.

Large Sense applications are sometimes split into several smaller applications to assist with load speed and focus the user's attention on a subset of data.

Whilst this split has several benefits, there is currently no built-in mechanism to transer these selections between the smaller apps

###Configuration

The App Linker supports up to five linked applications, each identified by a name and a target sheet ID.  The App Linker requires that each app has a name and a target sheet ID.  If either is omitted, the App will be ignored.

####Name

The name of the application is the name of the application as it appears in the hub.

####Target Sheet ID

The ID of the sheet that should be opened when the target application is opened from the App Linker.  Finding the ID of a sheet in an app involves a modicum of detective work.

#####Finding a sheet ID in the Desktop Edition

If you are using the extension in the Desktop edition of Sense, you should navigate to the 'Single Object' page at  [http://localhost:4848/resources/single.html].  You should first select the destination app, and then select the desired sheet from the list.  A preview area will show on the screen, and in this area, you will see a URL.  At the end of this URL, you will see the sheet ID:

localhost:4848/resources/single.html?appid=C%3A%5CUsers%5Cext_spt%5CDocuments%5CQlik%5CSense%5CApps%5CCountries2.qvf&sheet=**LkKpjs**

#####Finding a sheet ID in the Server Version

Open your app and navigate to the desired sheet.  The URL should look something like this:

yourdomain.com/sense/app/a924066c-cbcb-402a-b18a-ec63067529cd/sheet/**6fb541f1-186d-4dbc-acf4-02f53fe773d2**/state/analysis

The sheet ID appears immediately after the /sheet/ fragment of the URL, and is highlighted.

### Using the App Linker

Once the App Linker has been configured, it takes a short period of time to gather field information about the linked Apps.  It uses this field information to ascertain commonality between selections made in the current app and those in a destination app.

When the App Linker icon is clicked, the App Linker 'stage' is shown.  Each application is listed, together with the selections that can be transferred.  Non-transferable selections are also shown, but are visually distinguished.

