define(['qlik'], function(qlik) {

    "use strict";

    return {
        type: "items",
        component: "accordion",
        items: {
            linkedApps1: {
                type: "items",
                label: "App 1",
                items: {
                    app1: {
                        type: "string",
                        label: "Name",
                        ref: "app1"
                    },
                    app1Sheet: {
                        type: "string",
                        label: "Target sheet ID",
                        ref: "app1Sheet"
                    }
                }
            },
            linkedApps2: {
                type: "items",
                label: "App 2",
                items: {
                    app2: {
                        type: "string",
                        label: "Name",
                        ref: "app2"
                    },
                    app2Sheet: {
                        type: "string",
                        label: "Target sheet ID",
                        ref: "app2Sheet"
                    }
                }
            },
            linkedApps3: {
                type: "items",
                label: "App 3",
                items: {
                    app3: {
                        type: "string",
                        label: "Name",
                        ref: "app3"
                    },
                    app3Sheet: {
                        type: "string",
                        label: "Target sheet ID",
                        ref: "app3Sheet"
                    }
                }
            },
            linkedApps4: {
                type: "items",
                label: "App 4",
                items: {
                    app4: {
                        type: "string",
                        label: "Name",
                        ref: "app4"
                    },
                    app4Sheet: {
                        type: "string",
                        label: "Target sheet ID",
                        ref: "app4Sheet"
                    }
                }
            },
            linkedApps5: {
                type: "items",
                label: "App 5",
                items: {
                    app5: {
                        type: "string",
                        label: "Name",
                        ref: "app5"
                    },
                    app5Sheet: {
                        type: "string",
                        label: "Target sheet ID",
                        ref: "app5Sheet"
                    }
                }
            },
            settings: {
                uses: "settings"
                // ,
                // items: {
                //     additionalProperties: {
                //         type: "items",
                //         label: "Linked Apps",
                //         items: {
                //             a: {
                //                 ref: "hideIfCurrentApp",
                //                 label: "Hide linked app if it's the current app",
                //                 type: "boolean",
                //                 show: !0
                //             },
                //             b: {
                //                 ref: "hideIfNoTransferableSelections",
                //                 label: "Hide linked app if there are no transferable selections",
                //                 type: "boolean",
                //                 show: !0
                //             },
                //             c: {
                //                 ref: "showNonTransferableSelections",
                //                 label: "Show non-transferable selections",
                //                 type: "boolean",
                //                 show: !0
                //             }
                //         }
                //     }
                // }
            }
        }
    }
});
