import { useState } from "react";
import { CreditCard, Briefcase, User, CheckCircle } from "lucide-react";
import { cx } from "@/lib/finance-helpers";

export function AddUserComponent() {
  const [step, setStep] = useState(0);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const userTypes = [
    { id: 'admin', name: 'Admin', icon: User, color: 'var(--blue)' },
    { id: 'finance', name: 'Finance', icon: Briefcase, color: 'var(--green)' },
    { id: 'viewer', name: 'Viewer', icon: CreditCard, color: 'var(--amber)' },
    { id: 'approver', name: 'Approver', icon: CheckCircle, color: 'var(--rose)' },
  ];

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    setStep(1);
  };

  const handleNext = () => {
    setStep((prev) => Math.min(prev + 1, 2));
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 0));
  };

  const handleFinish = () => {
    console.log('User added:', selectedUser);
    setStep(0);
    setSelectedUser(null);
  };

  return (
    <div className="add-user-modal">
      <div className="add-user-modal__step">
        {step === 0 && (
          <>
            <h2 className="add-user-modal__title">Add New User</h2>
            <p className="add-user-modal__subtitle">Select user type to add to Notion workspace</p>
            <div className="add-user-modal__grid">
              {userTypes.map((user) => {
                const Icon = user.icon;
                return (
                  <button
                    key={user.id}
                    className={cx(
                      'add-user-modal__card',
                      selectedUser === user.id && 'add-user-modal__card--selected'
                    )}
                    onClick={() => handleUserSelect(user.id)}
                  >
                    <div className="add-user-modal__icon" style={{ backgroundColor: user.color + '20', color: user.color }}>
                      <Icon size={24} />
                    </div>
                    <span className="add-user-modal__label">{user.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="add-user-modal__info">
              <h4>Platform Setup</h4>
              <p>User will be created in Notion with financial access controls</p>
              <p>Roles grant access to specific database permissions and data ranges.</p>
            </div>
            <div className="add-user-modal__footer">
              <button
                className="button button--primary"
                onClick={handleNext}
                disabled={!selectedUser}
              >
                Next
              </button>
            </div>
          </>
        )}
        {step === 1 && (
          <>
            <h2 className="add-user-modal__title">Configure User Access</h2>
            <p className="add-user-modal__subtitle">Set up permissions for {selectedUser}</p>
            <div className="add-user-modal__steps">
              <div className="add-user-modal__step-item add-user-modal__step-item--active">
                <User size={16} />
                <span>Personal Info</span>
              </div>
              <div className="add-user-modal__step-item">
                <Briefcase size={16} />
                <span>Finance Access</span>
              </div>
              <div className="add-user-modal__step-item">
                <CreditCard size={16} />
                <span>Database Permissions</span>
              </div>
            </div>
            <div className="add-user-modal__forms">
              <div className="field">
                <label className="field__label">Email Address</label>
                <input type="email" className="field__input" placeholder="user@example.com" />
              </div>
              <div className="field">
                <label className="field__label">Name</label>
                <input type="text" className="field__input" placeholder="John Doe" />
              </div>
            </div>
            <div className="add-user-modal__footer">
              <button className="button" onClick={handleBack}>Back</button>
              <button className="button button--primary" onClick={handleNext}>Next</button>
            </div>
          </>
        )}
        {step === 2 && (
          <>
            <h2 className="add-user-modal__title">Review Settings</h2>
            <p className="add-user-modal__subtitle">Confirm user configuration</p>
            <div className="add-user-modal__summary">
              <div className="add-user-modal__summary-item">
                <User size={16} />
                <span>{selectedUser}</span>
              </div>
              <div className="add-user-modal__summary-item">
                <CreditCard size={16} />
                <span>Email: user@example.com</span>
              </div>
              <div className="add-user-modal__summary-item">
                <Briefcase size={16} />
                <span>Finance Access: Admin</span>
              </div>
            </div>
            <div className="add-user-modal__footer">
              <button className="button" onClick={handleBack}>Back</button>
              <button
                className="button button--primary button--danger"
                onClick={handleFinish}
              >
                Confirm & Add User
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}