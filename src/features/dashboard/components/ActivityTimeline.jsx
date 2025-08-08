import React from 'react';
import Icon from '../../../components/AppIcon';
import StatusBadgeSystem from '../../../components/ui/StatusBadgeSystem';
import Button from '../../../components/ui/Button';


const ActivityTimeline = ({ activities }) => {
  const getActivityIcon = (type) => {
    const icons = {
      financing: 'DollarSign',
      inspection: 'ClipboardCheck',
      parcel: 'MapPin',
      payment: 'CreditCard',
      notification: 'Bell',
      system: 'Settings'
    };
    return icons[type] || 'Activity';
  };

  const getActivityColor = (type) => {
    const colors = {
      financing: 'text-accent',
      inspection: 'text-primary',
      parcel: 'text-success',
      payment: 'text-secondary',
      notification: 'text-warning',
      system: 'text-muted-foreground'
    };
    return colors[type] || 'text-muted-foreground';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    return date.toLocaleDateString('es-VE');
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6 card-elevation">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">
          Actividad Reciente
        </h3>
        <Button variant="ghost" size="sm" iconName="MoreHorizontal" />
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Activity" size={32} className="mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No hay actividad reciente</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                index === 0 ? 'bg-primary/20' : 'bg-muted'
              }`}>
                <Icon 
                  name={getActivityIcon(activity.type)} 
                  size={16} 
                  className={index === 0 ? 'text-primary' : getActivityColor(activity.type)}
                />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">
                    {activity.title}
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </p>
                
                {activity.status && (
                  <div className="mt-2">
                    <StatusBadgeSystem status={activity.status} size="sm" />
                  </div>
                )}
                
                {activity.metadata && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {activity.metadata}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {activities.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button variant="ghost" size="sm" fullWidth>
            Ver toda la actividad
          </Button>
        </div>
      )}
    </div>
  );
};

export default ActivityTimeline;