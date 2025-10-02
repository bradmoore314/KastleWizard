

import React from 'react';
import { FolderPlus, FileUp } from 'lucide-react';

// Split the logo into two parts for different coloring
const logoShield = `
                                 -:::-#####                                 
                             ::::::::-#########%                            
                             :::::::::##########                            
                   -::::     :::::::::##########    :****                   
                :::::::::    :::::::::##########   ::*******                
               ::::::::::    :::::::::#########*   ::********               
       :::::   ::::::::::-::::::::::::###########%:::********   :+***       
    :::::::::  :::::::::::::::::::::::############***********   :+******    
    ::::::::::::::::::::::::::::::::::############************+::+******=   
    ::::::::::::::::::::::::::::::::::*##########***********************=   
    ::::::::::::::::::::::::::::::::::###########***********************=   
    ::::::::::::::::::::::::::::::::::*#########************************=   
    ::::::::::::::::::::::::::::::::::##########************************=   
    ::::::::::::::::::::::::::::::::    ########************************=   
    :::::::::::::::::::::::       ::::::::       ***********************=   
    :::::::::::::::::   :::::::::::::::::::::::::::    *****************=   
    :::::::::::   :::::::::::::::::      :::::::::::::::::   %**********=   
    ::   :::::::::::::::::   --::::::-########%   -::::::::::::::::   *+    
       -:::::::::::-   ::::::::::::::-###############    ::::::::::::       
              :::::::::::::::::::::::-##############*********=              
        :::::::::::::::::::::::::::::-##############****************        
    :::::::::::::::::::::::::::::::::-##############********************=   
    :::::::::::::::::::::::::::::::::-#############*********************=   
    ::::::::::::::::::::::::::::::-:    %*#########*********************=   
    ::::::::::::::::::::::::::   ::::::::::   %###**********************=   
    :::::::::::::::::      ::::::::::::::::::::::      *****************=   
    :::::::::::   ::::::::::::::::::::::::::::::::::::::::-  ***********=   
    :::-   ::::::::::::::::::::::::::::::::::::::::::::::::::::::   %+**    
       ::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::       
              :::::::::::::::::::::::::::::::::::::::::::::::=              
                         -::::::::::::::::::::::::-                         
                                 -:::::::::                                 
`;

const logoText = `
...    .....      .....      ........................ ....        ..........
...  .....       .......    ....    ..      ....      ....        ...       
........         ........   .......         ....      ....        ........  
.........       ....  ...     ........      ....      ....        ......... 
....  ....     ...........         .....    ....      ....        ...       
...    .....  .....    .... ............    ....      ........... ..........
...     ..... ....     ..... .........       ...      ......................
`;


const WelcomeScreen: React.FC<{
    onCreateProject: () => void;
    onImportProject: () => void;
}> = ({ onCreateProject, onImportProject }) => {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 sm:p-8 bg-background">
            <pre 
              aria-hidden="true" 
              className="font-bold font-mono text-center text-[4px] sm:text-[5px] md:text-[6px] leading-tight mb-6 sm:mb-8"
            >
                <span className="text-primary-600">{logoShield}</span>
                <span className="text-on-surface">{logoText}</span>
            </pre>
            <div className="max-w-xl">
                <h1 className="text-4xl font-bold text-on-surface mb-2">Welcome to the Kastle Wizard</h1>
                <p className="text-lg text-on-surface-variant mb-8">
                    Design, manage, and export professional security floor plans with ease.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={onCreateProject}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-transform hover:scale-105 text-base font-semibold shadow-lg"
                    >
                        <FolderPlus size={20} />
                        Create New Project
                    </button>
                    <button
                        onClick={onImportProject}
                        className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-surface text-on-surface rounded-lg hover:bg-white/10 border border-white/20 transition-colors text-base font-semibold"
                    >
                        <FileUp size={20} />
                        Import Project
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeScreen;