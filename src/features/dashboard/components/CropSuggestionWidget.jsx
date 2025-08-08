import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const CropSuggestionWidget = ({ parcels }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock AI-powered crop suggestions based on parcel data
  useEffect(() => {
    const generateSuggestions = () => {
      setLoading(true);
      
      // Simulate API call delay
      setTimeout(() => {
        const mockSuggestions = [
          {
            id: 1,
            crop: 'Maíz Amarillo',
            confidence: 92,
            reason: 'Suelo arcilloso ideal, temporada óptima',
            expectedYield: '4.5 ton/ha',
            profitability: 'Alta',
            season: 'Temporada seca',
            icon: 'Wheat'
          },
          {
            id: 2,
            crop: 'Frijol Negro',
            confidence: 87,
            reason: 'Complementa rotación, mejora suelo',
            expectedYield: '2.1 ton/ha',
            profitability: 'Media-Alta',
            season: 'Temporada lluviosa',
            icon: 'Leaf'
          },
          {
            id: 3,
            crop: 'Yuca',
            confidence: 78,
            reason: 'Resistente a sequía, demanda local',
            expectedYield: '18 ton/ha',
            profitability: 'Media',
            season: 'Todo el año',
            icon: 'TreePine'
          }
        ];
        
        setSuggestions(mockSuggestions);
        setLoading(false);
      }, 1500);
    };

    if (parcels && parcels.length > 0) {
      generateSuggestions();
    } else {
      setLoading(false);
    }
  }, [parcels]);

  const getProfitabilityColor = (profitability) => {
    switch (profitability) {
      case 'Alta': return 'text-success';
      case 'Media-Alta': return 'text-accent';
      case 'Media': return 'text-warning';
      case 'Baja': return 'text-error';
      default: return 'text-muted-foreground';
    }
  };

  if (!parcels || parcels.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6 card-elevation">
        <div className="flex items-center space-x-2 mb-4">
          <Icon name="Sparkles" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-foreground">
            Sugerencias de Cultivos IA
          </h3>
        </div>
        <div className="text-center py-6">
          <Icon name="MapPin" size={32} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-muted-foreground mb-2">
            Registra una parcela para recibir sugerencias personalizadas
          </p>
          <Button variant="outline" size="sm" iconName="Plus">
            Registrar Parcela
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 card-elevation">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Icon name="Sparkles" size={20} className="text-accent" />
          <h3 className="text-lg font-semibold text-foreground">
            Sugerencias de Cultivos IA
          </h3>
        </div>
        <Button variant="ghost" size="sm" iconName="RefreshCw" loading={loading}>
          Actualizar
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded mb-2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <div key={suggestion.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 micro-transition">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                  <Icon name={suggestion.icon} size={20} className="text-success" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-foreground">
                      {suggestion.crop}
                    </h4>
                    <div className="flex items-center space-x-1">
                      <Icon name="TrendingUp" size={14} className="text-success" />
                      <span className="text-sm font-medium text-success">
                        {suggestion.confidence}%
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-2">
                    {suggestion.reason}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Rendimiento: </span>
                      <span className="font-medium text-foreground">
                        {suggestion.expectedYield}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rentabilidad: </span>
                      <span className={`font-medium ${getProfitabilityColor(suggestion.profitability)}`}>
                        {suggestion.profitability}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-muted-foreground">
                    <Icon name="Calendar" size={12} className="inline mr-1" />
                    {suggestion.season}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          <Button variant="outline" size="sm" fullWidth iconName="ExternalLink">
            Ver análisis completo
          </Button>
        </div>
      )}
    </div>
  );
};

export default CropSuggestionWidget;