import React from "react";
import { Outlet } from "react-router-dom";

function Layout() {
    return (
        <div className="bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-10" style={{ paddingLeft: "15px", paddingRight: "15px" }}>

            <Outlet />



            <footer className="relative z-10 border-t border-slate-800/50 mt-auto">
                <div className=" mx-auto px-6 lg:px-8 py-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-slate-500 text-sm font-light">
                            © 2026 PollHub. Built with real-time technology.
                        </p>
                        <div className="flex items-center gap-6">
                            <button className="text-slate-500 hover:text-amber-400 text-sm font-light transition-colors">
                                About
                            </button>
                            <button className="text-slate-500 hover:text-amber-400 text-sm font-light transition-colors">
                                Privacy
                            </button>
                            <button className="text-slate-500 hover:text-amber-400 text-sm font-light transition-colors">
                                Terms
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Layout;
