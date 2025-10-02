import React, { useState, useMemo } from 'react';

// --- 📖 THE BIBLE: Task & Labor Hour Configuration 📖 ---
// This is the central source of truth. Edit the `hoursPerUnit` for any task to update the calculator.
// FIX: Define types for the configuration object to ensure type safety and resolve inference issues.
type TaskRole = 'specialist' | 'installer' | 'engineering' | 'pm';
interface Task {
  id: string;
  name: string;
  role: TaskRole;
  hoursPerUnit: number;
}
interface TaskCategoryData {
    name: string;
    tasks: Task[];
}

const TASK_DATA: Record<string, TaskCategoryData> = {
  video: {
    name: '📹 Video Systems',
    tasks: [
      // Specialist Tasks
      { id: 'vid_spec_net_setup', name: '🌐 Network set-up and config', role: 'specialist', hoursPerUnit: 8 },
      { id: 'vid_spec_load_vms', name: '🖥️ Load VMS on server', role: 'specialist', hoursPerUnit: 8 },
      { id: 'vid_spec_preconf_cams', name: '🔧 Pre-conf cameras - I/P, etc.', role: 'specialist', hoursPerUnit: 0.5 },
      { id: 'vid_spec_prog_rec_rates', name: '📈 Program recording rates', role: 'specialist', hoursPerUnit: 0.1 },
      { id: 'vid_spec_load_clients', name: '💻 Load VMS on clients', role: 'specialist', hoursPerUnit: 1 },
      { id: 'vid_spec_prog_callups', name: '🎥 Program camera call-up\'s', role: 'specialist', hoursPerUnit: 1 },
      { id: 'vid_spec_prog_integ', name: '🔗 Program other integration', role: 'specialist', hoursPerUnit: 1 },
      { id: 'vid_spec_verify_fov', name: '👁️ Verify focus and FOV (per camera)', role: 'specialist', hoursPerUnit: 0.17 },
      { id: 'vid_spec_nvr16', name: '💽 16 Channel NVR- set-up/program', role: 'specialist', hoursPerUnit: 8 },
      { id: 'vid_spec_nvr32', name: '💽 32 Channel NVR - set-up/program', role: 'specialist', hoursPerUnit: 16 },
      { id: 'vid_spec_acceptance', name: '✅ Acceptance Testing', role: 'specialist', hoursPerUnit: 8 },
      { id: 'vid_spec_training', name: '👨‍🏫 Owner Training on Video', role: 'specialist', hoursPerUnit: 4 },
      // Installer Tasks
      { id: 'vid_inst_racks', name: '🗄️ Install racks', role: 'installer', hoursPerUnit: 8 },
      { id: 'vid_inst_backbone', name: '🧵 Install network backbone (Cat6) (per K ft.)', role: 'installer', hoursPerUnit: 8 },
      { id: 'vid_inst_patch12', name: '🔌 Install 12 channel patch panels/punch blocks', role: 'installer', hoursPerUnit: 4 },
      { id: 'vid_inst_patch24', name: '🔌 Install 24 channel patch panels/punch blocks', role: 'installer', hoursPerUnit: 8 },
      { id: 'vid_inst_switch12', name: '🔄 Install 12 port switches', role: 'installer', hoursPerUnit: 3 },
      { id: 'vid_inst_switch24', name: '🔄 Install 24 port switches', role: 'installer', hoursPerUnit: 3 },
      { id: 'vid_inst_encoders', name: '🎛️ Install encoders (per port)', role: 'installer', hoursPerUnit: 0.25 },
      { id: 'vid_inst_ups', name: '🔋 Install UPS\'s', role: 'installer', hoursPerUnit: 2 },
      { id: 'vid_inst_server', name: '🖥️ Install server/NVR', role: 'installer', hoursPerUnit: 2 },
      { id: 'vid_inst_wall_monitor', name: '📺 Install wall mounted monitor', role: 'installer', hoursPerUnit: 4 },
      { id: 'vid_inst_desk_monitor', name: '💻 Install desk top monitors', role: 'installer', hoursPerUnit: 0.5 },
      { id: 'vid_inst_console', name: '🕹️ Install security console', role: 'installer', hoursPerUnit: 16 },
      { id: 'vid_inst_cam_cable', name: '🧵 Install cable to cameras (per K ft.)', role: 'installer', hoursPerUnit: 8 },
      { id: 'vid_inst_test_cable', name: '🔬 Test all cable runs (per camera)', role: 'installer', hoursPerUnit: 0.125 },
      { id: 'vid_inst_wireless_ptp', name: '📡 Install Wireless PTP Access Points', role: 'installer', hoursPerUnit: 3 },
    ],
  },
  accessControl: {
    name: '🔑 Access Control',
    tasks: [
      // Specialist Tasks
      { id: 'ac_spec_net_setup', name: '🌐 Network set-up and config', role: 'specialist', hoursPerUnit: 8 },
      { id: 'ac_spec_load_sw_server', name: '🖥️ Load SW on Server', role: 'specialist', hoursPerUnit: 8 },
      { id: 'ac_spec_load_sw_clients', name: '💻 Load SW on clients', role: 'specialist', hoursPerUnit: 2 },
      { id: 'ac_spec_create_graphics', name: '🗺️ Create floor plan graphics', role: 'specialist', hoursPerUnit: 4 },
      { id: 'ac_spec_import_db', name: '📇 Import/create card holder database', role: 'specialist', hoursPerUnit: 8 },
      { id: 'ac_spec_setup_params', name: '⚙️ Set-up card holder parameters', role: 'specialist', hoursPerUnit: 4 },
      { id: 'ac_spec_prog_net_ctrl', name: '🎛️ Program network controller', role: 'specialist', hoursPerUnit: 4 },
      { id: 'ac_spec_prog_door_ctrl', name: '🚪 Program access door controllers', role: 'specialist', hoursPerUnit: 1 },
      { id: 'ac_spec_install_badge', name: '🆔 Install Badging Station and Camera', role: 'specialist', hoursPerUnit: 12 },
      { id: 'ac_spec_install_visitor', name: '👋 Install Visitor Management System', role: 'specialist', hoursPerUnit: 12 },
      { id: 'ac_spec_prog_hr', name: '🔗 Program/test integration w/ H.R. System', role: 'specialist', hoursPerUnit: 32 },
      { id: 'ac_spec_prog_ad', name: '🔗 Program/test integration w/ Active Directory', role: 'specialist', hoursPerUnit: 24 },
      { id: 'ac_spec_startup_doors', name: '✅ Start-up and test access control doors', role: 'specialist', hoursPerUnit: 1 },
      { id: 'ac_spec_startup_contacts', name: '✅ Start-up and test door contacts', role: 'specialist', hoursPerUnit: 0.5 },
      { id: 'ac_spec_startup_gates', name: '✅ Start-up and test gates', role: 'specialist', hoursPerUnit: 4 },
      { id: 'ac_spec_acceptance', name: '👍 Acceptance Testing', role: 'specialist', hoursPerUnit: 8 },
      { id: 'ac_spec_training', name: '👨‍🏫 Owner Training on Access Control', role: 'specialist', hoursPerUnit: 8 },
      // Installer Tasks
      { id: 'ac_inst_build_med_panels', name: '🏗️ Build & install medium panels', role: 'installer', hoursPerUnit: 4 },
      { id: 'ac_inst_build_lrg_panels', name: '🏗️ Build & install large panels', role: 'installer', hoursPerUnit: 8 },
      { id: 'ac_inst_lock_power', name: '⚡ Install lock power supplies', role: 'installer', hoursPerUnit: 2 },
      { id: 'ac_inst_composite_cable', name: '🧵 Install composite cable to doors (per K ft)', role: 'installer', hoursPerUnit: 10 },
      { id: 'ac_inst_contact_cable', name: '🧵 Install cable to contacts only (per K ft)', role: 'installer', hoursPerUnit: 8 },
      { id: 'ac_inst_panic_cable', name: '🧵 Install cable to panic switches (per K ft)', role: 'installer', hoursPerUnit: 8 },
      { id: 'ac_inst_gate_cable', name: '🧵 Install cable to gates (per K ft)', role: 'installer', hoursPerUnit: 10 },
      { id: 'ac_inst_pedestals', name: '🏛️ Install gate pedestals', role: 'installer', hoursPerUnit: 4 },
      { id: 'ac_inst_readers', name: '💳 Install card readers', role: 'installer', hoursPerUnit: 1 },
      { id: 'ac_inst_door_contacts', name: '🧲 Install door contacts', role: 'installer', hoursPerUnit: 0.5 },
      { id: 'ac_inst_rex', name: '🏃 Install REX\'s', role: 'installer', hoursPerUnit: 1 },
      { id: 'ac_inst_maglocks', name: '🔒 Install mag locks', role: 'installer', hoursPerUnit: 1.5 },
      { id: 'ac_inst_strikes_cutin', name: '🚪 Install electric strikes (cut-in)', role: 'installer', hoursPerUnit: 1 },
      { id: 'ac_inst_strikes_cyl', name: '🚪 Install electric strikes (cylindrical)', role: 'installer', hoursPerUnit: 0.5 },
      { id: 'ac_inst_mortise', name: '🔐 Install mortise locks', role: 'installer', hoursPerUnit: 2 },
      { id: 'ac_inst_hinges', name: '⚙️ Install transfer hinges', role: 'installer', hoursPerUnit: 0.5 },
    ],
  },
  intrusion: {
      name: '🛡️ Intrusion Systems',
      tasks: [
          // Specialist Tasks
          { id: 'int_spec_prog_zones', name: '📍 Program points/zones', role: 'specialist', hoursPerUnit: 0.5 },
          { id: 'int_spec_enter_user', name: '👤 Enter account/user info', role: 'specialist', hoursPerUnit: 4 },
          { id: 'int_spec_test_all', name: '✅ Test all devices', role: 'specialist', hoursPerUnit: 1 },
          { id: 'int_spec_transmit', name: '📡 Transmit signals to monitoring receiver', role: 'specialist', hoursPerUnit: 0.1 },
          { id: 'int_spec_acceptance', name: '👍 Acceptance testing', role: 'specialist', hoursPerUnit: 4 },
          { id: 'int_spec_training', name: '👨‍🏫 Owner Training on Intrusion', role: 'specialist', hoursPerUnit: 4 },
          // Installer Tasks
          { id: 'int_inst_panel', name: '🎛️ Install intrusion panel', role: 'installer', hoursPerUnit: 4 },
          { id: 'int_inst_cable', name: '🧵 Pull cable to devices (per K ft.)', role: 'installer', hoursPerUnit: 8 },
          { id: 'int_inst_modules', name: '🧩 Install addressable modules', role: 'installer', hoursPerUnit: 1 },
          { id: 'int_inst_contacts', name: '🧲 Install door contacts', role: 'installer', hoursPerUnit: 1 },
          { id: 'int_inst_motion', name: '🏃 Install motion sensors', role: 'installer', hoursPerUnit: 1 },
          { id: 'int_inst_glassbreak', name: '💥 Install glass break detectors', role: 'installer', hoursPerUnit: 1 },
          { id: 'int_inst_keypads', name: '🔢 Install keypads', role: 'installer', hoursPerUnit: 1 },
      ]
  },
  // ... other categories like Intercom and General can be added here following the same structure
};

const currencyFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

// --- ✏️ Individual Task Row Component ---
interface TaskRowProps {
  task: Task;
  quantity: number;
  onQuantityChange: (id: string, value: number) => void;
}

const TaskRow: React.FC<TaskRowProps> = ({ task, quantity, onQuantityChange }) => {
  const totalHours = (quantity * task.hoursPerUnit).toFixed(2);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '5fr 1fr 1fr 1fr', gap: '10px', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #333' }}>
      <span style={{ fontSize: '0.9rem' }}>{task.name}</span>
      <span style={{ textAlign: 'center', color: '#aaa' }}>{task.hoursPerUnit}</span>
      <input
        type="number"
        min="0"
        value={quantity || ''}
        onChange={(e) => onQuantityChange(task.id, parseInt(e.target.value, 10) || 0)}
        style={{ width: '60px', padding: '5px', backgroundColor: '#1e1e1e', color: '#fff', border: '1px solid #555', borderRadius: '4px', textAlign: 'center' }}
        placeholder="0"
      />
      <span style={{ textAlign: 'right', fontWeight: 'bold', color: '#98C379' }}>{totalHours}</span>
    </div>
  );
};

// --- 🗂️ Collapsible Category Component ---
interface TaskCategoryProps {
  category: TaskCategoryData;
  quantities: { [key: string]: number };
  onQuantityChange: (id: string, value: number) => void;
}

const TaskCategory: React.FC<TaskCategoryProps> = ({ category, quantities, onQuantityChange }) => {
  const specialistTasks = category.tasks.filter(t => t.role === 'specialist');
  const installerTasks = category.tasks.filter(t => t.role === 'installer');
  
  const totalHours = category.tasks.reduce((sum, task) => sum + (quantities[task.id] || 0) * task.hoursPerUnit, 0);

  return (
    <details open style={{ background: '#2c2f33', borderRadius: '8px', marginBottom: '15px', border: '1px solid #444' }}>
      <summary style={{ padding: '15px', cursor: 'pointer', fontWeight: 'bold', fontSize: '1.2rem', color: '#61AFEF', display: 'flex', justifyContent: 'space-between' }}>
        <span>{category.name}</span>
        <span style={{ color: '#E5C07B' }}>Total: {totalHours.toFixed(2)} hrs</span>
      </summary>
      <div style={{ padding: '0 15px 15px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div>
            <h3 style={{ color: '#C678DD', borderBottom: '1px solid #555', paddingBottom: '5px' }}>🧑‍💻 Specialist Tasks</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '5fr 1fr 1fr 1fr', gap: '10px', fontWeight: 'bold', fontSize: '0.8rem', color: '#aaa', padding: '0 8px' }}>
              <span>Task</span><span style={{textAlign: 'center'}}>Hrs/Unit</span><span style={{textAlign: 'center'}}>Qty</span><span style={{textAlign: 'right'}}>Total Hrs</span>
            </div>
            {specialistTasks.map(task => (
              <TaskRow key={task.id} task={task} quantity={quantities[task.id] || 0} onQuantityChange={onQuantityChange} />
            ))}
          </div>
          <div>
            <h3 style={{ color: '#56B6C2', borderBottom: '1px solid #555', paddingBottom: '5px' }}>👷‍♂️ Installer Tasks</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '5fr 1fr 1fr 1fr', gap: '10px', fontWeight: 'bold', fontSize: '0.8rem', color: '#aaa', padding: '0 8px' }}>
              <span>Task</span><span style={{textAlign: 'center'}}>Hrs/Unit</span><span style={{textAlign: 'center'}}>Qty</span><span style={{textAlign: 'right'}}>Total Hrs</span>
            </div>
            {installerTasks.map(task => (
              <TaskRow key={task.id} task={task} quantity={quantities[task.id] || 0} onQuantityChange={onQuantityChange} />
            ))}
          </div>
        </div>
      </div>
    </details>
  );
};

// --- 🚀 Main Calculator Component ---
const LaborEstimator: React.FC = () => {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [laborRates, setLaborRates] = useState({ specialist: 120, installer: 85, engineering: 150, pm: 110 });

  const handleQuantityChange = (id: string, value: number) => {
    setQuantities(prev => ({ ...prev, [id]: value }));
  };

  const handleRateChange = (role: keyof typeof laborRates, value: number) => {
    setLaborRates(prev => ({ ...prev, [role]: value }));
  };

  const totals = useMemo(() => {
    // FIX: Explicitly type the 'hours' accumulator to ensure its properties are inferred as numbers.
    const hours: Record<TaskRole, number> = { specialist: 0, installer: 0, engineering: 0, pm: 0 };
    Object.values(TASK_DATA).forEach(category => {
      category.tasks.forEach(task => {
        const qty = quantities[task.id] || 0;
        if (qty > 0) {
          hours[task.role] += qty * task.hoursPerUnit;
        }
      });
    });

    const costs = {
      specialist: hours.specialist * laborRates.specialist,
      installer: hours.installer * laborRates.installer,
      engineering: hours.engineering * laborRates.engineering,
      pm: hours.pm * laborRates.pm,
    };
    
    const totalHours = Object.values(hours).reduce((a, b) => a + b, 0);
    const totalCost = Object.values(costs).reduce((a, b) => a + b, 0);

    return { hours, costs, totalHours, totalCost };
  }, [quantities, laborRates]);

  return (
    <div style={{ fontFamily: '"Segoe UI", sans-serif', color: '#fff', padding: '20px', maxWidth: '1400px', margin: 'auto' }}>
      
      {/* --- Summary Section --- */}
      <div style={{ background: '#282c34', padding: '20px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #61AFEF' }}>
        <h2 style={{ margin: '0 0 15px 0', color: '#E5C07B', textAlign: 'center' }}>📈 Labor Summary & Costs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', alignItems: 'center' }}>
          {Object.entries(totals.hours).map(([role, hours]) => (
            <div key={role} style={{ background: '#21252B', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ textTransform: 'capitalize', fontSize: '1rem', color: '#aaa' }}>{role}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '5px 0' }}>{hours.toFixed(2)} hrs</div>
              <div style={{ fontSize: '1.2rem', color: '#98C379' }}>{currencyFormatter.format(totals.costs[role as keyof typeof totals.costs])}</div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ marginRight: '5px', fontSize: '0.8rem' }}>$</span>
                <input
                  type="number"
                  value={laborRates[role as keyof typeof laborRates]}
                  onChange={e => handleRateChange(role as keyof typeof laborRates, parseInt(e.target.value) || 0)}
                  style={{ width: '60px', padding: '4px', backgroundColor: '#282c34', color: '#fff', border: '1px solid #555', borderRadius: '4px' }}
                />
                <span style={{ marginLeft: '5px', fontSize: '0.8rem' }}>/hr</span>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '2px solid #61AFEF' }}>
          <span style={{ fontSize: '1.2rem', color: '#aaa' }}>Grand Total: </span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#E5C07B' }}>{totals.totalHours.toFixed(2)} Hours</span>
          <span style={{ margin: '0 15px', fontSize: '2rem' }}>|</span>
          <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#98C379' }}>{currencyFormatter.format(totals.totalCost)}</span>
        </div>
      </div>

      {/* --- Task Sections --- */}
      {Object.values(TASK_DATA).map(category => (
        <TaskCategory 
          key={category.name} 
          category={category} 
          quantities={quantities} 
          onQuantityChange={handleQuantityChange} 
        />
      ))}
    </div>
  );
};

export default LaborEstimator;
