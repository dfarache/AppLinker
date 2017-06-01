define([], function() {
    "use strict";
    return {
        type: "items",
        component: "accordion",
        items: {
            linkedApps: {
                type: "items",
                label: "Linked Applications",
                items: {
                    app1: {
                        type: "string",
                        label: "App 1",
                        ref: "app1"
                    },
                    app2: {
                        type: "string",
                        label: "App 2",
                        ref: "app2"
                    },
                    app3: {
                        type: "string",
                        label: "App 3",
                        ref: "app3"
                    },
                    app4: {
                        type: "string",
                        label: "App 4",
                        ref: "app4"
                    },
                    app5: {
                        type: "string",
                        label: "App 5",
                        ref: "app5"
                    },
                    app6: {
                        type: "string",
                        label: "App 6",
                        ref: "app6"
                    },
                    app7: {
                        type: "string",
                        label: "App 7",
                        ref: "app7"
                    },
                    app8: {
                        type: "string",
                        label: "App 8",
                        ref: "app8"
                    },
                    app9: {
                        type: "string",
                        label: "App 9",
                        ref: "app9"
                    },
                    app10: {
                        type: "string",
                        label: "App 10",
                        ref: "app10"
                    }

                }
            },
            general: {
                type: "items",
                label: "Debug",
                items: {
                    fixed: {
                        ref: "showDebugInfo",
                        label: "Show Debug Information",
                        type: "boolean",
                        defaultValue: true
                    }
                }
            },
            /*
        appearance: {
            type: "items",
            label: "Appearance",
            items: {
                fixed: {
                    ref: "tileWidth",
                    label: "Tile Width",
                    type: "string",
                    defaultValue: "50px"
                }
            }
        },*/
            settings: {
                uses: "settings"
            }
        }
    }
});
