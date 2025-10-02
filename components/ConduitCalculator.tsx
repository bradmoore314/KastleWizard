import React, { useState, useMemo } from 'react';

// --- ⚙️ MASTER CONFIGURATION ⚙️ ---
// Adjust these values to match your specific material costs and labor estimates.
const LABOR_HOURS_PER_BEND = 0.15; // Represents ~9 minutes per bend

const CONDUIT_CONFIG = {
  types: {
    EMT: {
      name: 'EMT (Metal Tubing)',
      sizes: {
        '0.5': { costPerFoot: 0.85, laborHoursPerFoot: 0.08, costPerBend: 1.50 },
        '0.75': { costPerFoot: 1.25, laborHoursPerFoot: 0.10, costPerBend: 2.50 },
        '1': { costPerFoot: 1.90, laborHoursPerFoot: 0.12, costPerBend: 3.75 },
        '1.25': { costPerFoot: 2.80, laborHoursPerFoot: 0.15, costPerBend: 5.00 },
      },
    },
    IMC: {
      name: 'IMC (Intermediate Metal)',
      sizes: {
        '0.5': { costPerFoot: 1.80, laborHoursPerFoot: 0.12, costPerBend: 2.80 },
        '0.75': { costPerFoot: 2.40, laborHoursPerFoot: 0.15, costPerBend: 3.90 },
        '1': { costPerFoot: 3.50, laborHoursPerFoot: 0.18, costPerBend: 5.50 },
        '1.25': { costPerFoot: 4.80, laborHoursPerFoot: 0.22, costPerBend: 7.20 },
      },
    },
    Rigid: {
      name: 'Rigid (Heavywall Metal)',
      sizes: {
        '0.5': { costPerFoot: 2.50, laborHoursPerFoot: 0.15, costPerBend: 3.50 },
        '0.75': { costPerFoot: 3.20, laborHoursPerFoot: 0.18, costPerBend: 4.80 },
        '1': { costPerFoot: 4.50, laborHoursPerFoot: 0.22, costPerBend: 6.50 },
        '1.25': { costPerFoot: 6.00, laborHoursPerFoot: 0.26, costPerBend: 8.90 },
      },
    },
    PVC_40: {
      name: 'PVC (Schedule 40)',
      sizes: {
        '0.5': { costPerFoot: 0.60, laborHoursPerFoot: 0.07, costPerBend: 0.80 },
        '0.75': { costPerFoot: 0.90, laborHoursPerFoot: 0.09, costPerBend: 1.20 },
        '1': { costPerFoot: 1.30, laborHoursPerFoot: 0.11, costPerBend: 1.80 },
        '1.25': { costPerFoot: 2.10, laborHoursPerFoot: 0.14, costPerBend: 2.50 },
      },
    },
    PVC_80: {
      name: 'PVC (Schedule 80)',
      sizes: {
        '0.5': { costPerFoot: 0.95, laborHoursPerFoot: 0.08, costPerBend: 1.10 },
        '0.75': { costPerFoot: 1.35, laborHoursPerFoot: 0.10, costPerBend: 1.60 },
        '1': { costPerFoot: 1.95, laborHoursPerFoot: 0.12, costPerBend: 2.40 },
        '1.25': { costPerFoot: 2.90, laborHoursPerFoot: 0.15, costPerBend: 3.20 },
      },
    },
  },
  environments: {
    Easy: { name: '✅ Easy (Open Ceiling)', multiplier: 1.0 },
    Medium: { name: '⚠️ Medium (Drywall)', multiplier: 1.5 },
    Hard: { name: '🔥 Hard (Concrete/Block)', multiplier: 2.2 },
  },
};

type ConduitType = keyof typeof CONDUIT_CONFIG.types;
type ConduitSize = keyof typeof CONDUIT_CONFIG.types[ConduitType]['sizes'];
type EnvironmentType = keyof typeof CONDUIT_CONFIG.environments;

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const BreakdownRow: React.FC<{ label: string, calculation: string, result: string }> = ({ label, calculation, result }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', fontSize: '1rem' }}>
        <span style={{ color: '#aaa' }}>{label}</span>
        <div style={{ textAlign: 'right' }}>
            <span style={{ fontFamily: 'monospace', color: '#ccc', fontSize: '0.9rem' }}>{calculation}</span>
            <span style={{ fontWeight: 600, marginLeft: '15px', minWidth: '100px', display: 'inline-block' }}>{result}</span>
        </div>
    </div>
);

const BreakdownSection: React.FC<{ title: string, children: React.ReactNode, totalLabel: string, totalValue: string }> = ({ title, children, totalLabel, totalValue }) => (
    <div style={{ marginBottom: '25px' }}>
        <h3 style={{ margin: 0, paddingBottom: '10px', borderBottom: '1px solid #444', color: '#61AFEF', fontSize: '1.2rem' }}>{title}</h3>
        <div style={{ padding: '10px 0' }}>{children}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #444', fontWeight: 'bold' }}>
            <span>{totalLabel}</span>
            <span>{totalValue}</span>
        </div>
    </div>
);

const ConduitCostCalculator: React.FC = () => {
  const [length, setLength] = useState<number>(100);
  const [bends, setBends] = useState<number>(4);
  const [conduitType, setConduitType] = useState<ConduitType>('EMT');
  const [conduitSize, setConduitSize] = useState<ConduitSize>('0.75');
  const [environment, setEnvironment] = useState<EnvironmentType>('Easy');
  const [laborRate, setLaborRate] = useState<number>(95);

  const availableSizes = Object.keys(CONDUIT_CONFIG.types[conduitType].sizes);

  React.useEffect(() => {
    if (!CONDUIT_CONFIG.types[conduitType].sizes[conduitSize]) {
      setConduitSize(availableSizes[0] as ConduitSize);
    }
  }, [conduitType, conduitSize, availableSizes]);

  const calculation = useMemo(() => {
    const sizeConfig = CONDUIT_CONFIG.types[conduitType].sizes[conduitSize];
    if (!sizeConfig) return { materialCost: 0, laborHours: 0, laborCost: 0, totalCost: 0 };
    
    const conduitMaterialCost = length * sizeConfig.costPerFoot;
    const bendMaterialCost = bends * sizeConfig.costPerBend;
    const totalMaterialCost = conduitMaterialCost + bendMaterialCost;
    
    const baseConduitLabor = length * sizeConfig.laborHoursPerFoot;
    const bendLabor = bends * LABOR_HOURS_PER_BEND;
    const subtotalLaborHours = baseConduitLabor + bendLabor;
    
    const envMultiplier = CONDUIT_CONFIG.environments[environment].multiplier;
    const totalAdjustedLaborHours = subtotalLaborHours * envMultiplier;
    
    const totalLaborCost = totalAdjustedLaborHours * laborRate;
    const totalCost = totalMaterialCost + totalLaborCost;

    return {
      sizeConfig,
      conduitMaterialCost,
      bendMaterialCost,
      totalMaterialCost,
      baseConduitLabor,
      bendLabor,
      subtotalLaborHours,
      envMultiplier,
      totalAdjustedLaborHours,
      totalLaborCost,
      totalCost,
    };
  }, [length, bends, conduitType, conduitSize, environment, laborRate]);

  const styles: { [key: string]: React.CSSProperties } = {
    calculatorBody: {
      padding: '30px',
      maxWidth: '800px',
      margin: '40px auto',
      fontFamily: '"Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#e0e0e0',
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      borderBottom: '2px solid #56B6C2',
      paddingBottom: '15px',
    },
    title: {
      margin: 0,
      fontSize: '2.5rem',
      fontWeight: '700',
      color: '#fff',
      textShadow: '0 0 10px rgba(86, 182, 194, 0.5)',
    },
    inputGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '20px',
      marginBottom: '30px',
    },
    inputGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    label: {
      marginBottom: '8px',
      fontSize: '0.9rem',
      fontWeight: 600,
      color: '#aaa',
    },
    input: {
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #444',
      backgroundColor: '#1e1e1e',
      color: '#e0e0e0',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    select: {
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #444',
      backgroundColor: '#1e1e1e',
      color: '#e0e0e0',
      fontSize: '1rem',
      outline: 'none',
      transition: 'all 0.2s ease',
    },
    resultsContainer: {
      padding: '25px',
      backgroundColor: 'rgba(0,0,0,0.2)',
      borderRadius: '12px',
      border: '1px solid #333',
    },
    resultsHeader: {
      margin: '0 0 20px 0',
      textAlign: 'center',
      fontSize: '1.8rem',
      color: '#E5C07B',
    },
    grandTotalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '20px',
      marginTop: '20px',
      fontSize: '2rem',
      fontWeight: '700',
      color: '#fff',
      backgroundColor: '#98C379',
      borderRadius: '8px',
    },
  };

  return (
    <div style={styles.calculatorBody}>
      <div style={styles.header}>
        <h1 style={styles.title}>⚡ Detailed Conduit Cost Estimator ⚡</h1>
      </div>
      
      <div style={styles.inputGrid}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>📏 Conduit Length (feet)</label>
          <input type="number" style={styles.input} value={length} onChange={(e) => setLength(Number(e.target.value))} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>↪️ Number of Bends</label>
          <input type="number" style={styles.input} value={bends} onChange={(e) => setBends(Number(e.target.value))} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>💵 Labor Rate ($/hour)</label>
          <input type="number" style={styles.input} value={laborRate} onChange={(e) => setLaborRate(Number(e.target.value))} />
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>🔩 Conduit Type</label>
          <select style={styles.select} value={conduitType} onChange={(e) => setConduitType(e.target.value as ConduitType)}>
            {Object.entries(CONDUIT_CONFIG.types).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>⭕ Conduit Size (inches)</label>
          <select style={styles.select} value={conduitSize} onChange={(e) => setConduitSize(e.target.value as ConduitSize)}>
            {availableSizes.map((size) => (
              <option key={size} value={size}>{`${size}"`}</option>
            ))}
          </select>
        </div>
        <div style={styles.inputGroup}>
          <label style={styles.label}>🏗️ Installation Environment</label>
          <select style={styles.select} value={environment} onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}>
            {Object.entries(CONDUIT_CONFIG.environments).map(([key, { name }]) => (
              <option key={key} value={key}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={styles.resultsContainer}>
        <h2 style={styles.resultsHeader}>📊 Cost Breakdown 📊</h2>
        
        <BreakdownSection title="Material Cost" totalLabel="Total Material Cost" totalValue={formatter.format(calculation.totalMaterialCost)}>
          <BreakdownRow label="Conduit Run" calculation={`${length} ft @ ${formatter.format(calculation.sizeConfig.costPerFoot)}/ft`} result={formatter.format(calculation.conduitMaterialCost)} />
          <BreakdownRow label="Bends/Fittings" calculation={`${bends} bends @ ${formatter.format(calculation.sizeConfig.costPerBend)}/bend`} result={formatter.format(calculation.bendMaterialCost)} />
        </BreakdownSection>
        
        <BreakdownSection title="Labor Cost" totalLabel="Total Labor Cost" totalValue={formatter.format(calculation.totalLaborCost)}>
          <BreakdownRow label="Base Conduit Labor" calculation={`${length} ft × ${calculation.sizeConfig.laborHoursPerFoot} hrs/ft`} result={`${calculation.baseConduitLabor.toFixed(2)} hrs`} />
          <BreakdownRow label="Bend Labor" calculation={`${bends} bends × ${LABOR_HOURS_PER_BEND} hrs/bend`} result={`${calculation.bendLabor.toFixed(2)} hrs`} />
          <BreakdownRow label="Subtotal Base Labor" calculation={`${calculation.baseConduitLabor.toFixed(2)} + ${calculation.bendLabor.toFixed(2)}`} result={`${calculation.subtotalLaborHours.toFixed(2)} hrs`} />
          <BreakdownRow label="Environment Multiplier" calculation={`${CONDUIT_CONFIG.environments[environment].name}`} result={`× ${calculation.envMultiplier.toFixed(1)}`} />
          <BreakdownRow label="Total Adjusted Labor" calculation={`${calculation.subtotalLaborHours.toFixed(2)} hrs × ${calculation.envMultiplier.toFixed(1)}`} result={`${calculation.totalAdjustedLaborHours.toFixed(2)} hrs`} />
          <BreakdownRow label="Labor Cost" calculation={`${calculation.totalAdjustedLaborHours.toFixed(2)} hrs @ ${formatter.format(laborRate)}/hr`} result={formatter.format(calculation.totalLaborCost)} />
        </BreakdownSection>

        <div style={styles.grandTotalRow}>
          <span>💰 Grand Total</span>
          <span>{formatter.format(calculation.totalCost)}</span>
        </div>
      </div>
    </div>
  );
};

export default ConduitCostCalculator;