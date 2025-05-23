import React, { createContext, useState, useContext, useEffect } from 'react';

const RideContext = createContext(null);

export const useRide = () => useContext(RideContext);

export const RideProvider = ({ children }) => {
  const [activeRide, setActiveRide] = useState(null); // Para a corrida ATIVA (aceita pelo motorista ou em andamento pelo passageiro)
  const [driverLocation, setDriverLocation] = useState(null); // Localização do motorista da corrida ATIVA
  const [rideToRateDetails, setRideToRateDetails] = useState(null);
  let locationUpdateInterval = null;

  // Para o painel do motorista: lista de corridas PENDENTES de aceite
  const [pendingRides, setPendingRides] = useState([]);

  const [rideHistory, setRideHistory] = useState([
    {
      id: 'hist_ride_001',
      rated: true, // Adiciona campo para indicar se foi avaliada
      date: '15/07/2024',
      time: '14:30',
      pickupAddress: 'Rua das Palmeiras, 123, São Paulo, SP',
      destinationAddress: 'Avenida Paulista, 1500, São Paulo, SP',
      driverName: 'João Silva',
      carDetails: 'Toyota Corolla - BRA0S15',
      fare: 25.50,
      status: 'Concluída',
    },
    {
      id: 'hist_ride_002',
      date: '16/07/2024',
      time: '09:15',
      rated: true,
      pickupAddress: 'Rua Augusta, 500, São Paulo, SP',
      destinationAddress: 'Parque Ibirapuera, Portão 3, São Paulo, SP',
      driverName: 'Maria Oliveira',
      carDetails: 'Honda Civic - PLM2P08',
      fare: 18.75,
      status: 'Concluída',
    },
    {
      id: 'hist_ride_003',
      date: '17/07/2024',
      time: '18:00',
      rated: false, // Corridas canceladas não são avaliadas
      pickupAddress: 'Shopping Eldorado, São Paulo, SP',
      destinationAddress: 'Rua Oscar Freire, 1000, São Paulo, SP',
      driverName: 'Carlos Pereira',
      carDetails: 'Chevrolet Onix - JKL1F25',
      fare: 0.00, // Cancelada antes do motorista chegar
      status: 'Cancelada',
    },
    {
      id: 'hist_ride_004',
      date: '18/07/2024',
      time: '11:45',
      rated: true,
      pickupAddress: 'Aeroporto de Congonhas, São Paulo, SP',
      destinationAddress: 'Hotel Transamérica, São Paulo, SP',
      driverName: 'Ana Costa',
      carDetails: 'Hyundai HB20 - QWE4R52',
      fare: 35.20,
      status: 'Concluída',
    },
     {
      id: 'hist_ride_005',
      date: '19/07/2024',
      time: '20:10',
      rated: false, // Exemplo de uma não avaliada ainda
      pickupAddress: 'Estádio do Morumbi, São Paulo, SP',
      destinationAddress: 'Bar Brahma, Centro, São Paulo, SP',
      driverName: 'Lucas Martins',
      carDetails: 'Volkswagen Gol - GOL2B11',
      fare: 42.00,
      status: 'Concluída',
    }
  ]);

  // Simula a aceitação de uma corrida por um motorista
  const simulate_acceptRide = (rideDetails) => {
    const rideData = {
      id: rideDetails.id || `ride_${Date.now()}`,
      driverInfo: {
        name: 'Carlos Motorista',
        photoUrl: 'https://via.placeholder.com/150/0000FF/808080?Text=Driver', // Placeholder image
      },
      carInfo: {
        model: 'Toyota Corolla',
        plate: 'XYZ-1234',
      },
      status: 'PICKING_UP', // 'ACCEPTED', 'PICKING_UP', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
      pickupLocation: rideDetails.pickupLocation,
      destinationLocation: rideDetails.destinationLocation,
      // Posição inicial do motorista (pode ser aleatória ou baseada na partida)
      driverLocation: {
        lat: rideDetails.pickupLocation.lat + 0.01, // Simula motorista um pouco distante
        lng: rideDetails.pickupLocation.lng + 0.01,
      },
      routePolyline: rideDetails.routePolyline || [], // Rota da partida ao destino
    };
    setActiveRide(rideData);
    setDriverLocation(rideData.driverLocation); // Seta a localização inicial do motorista
    console.log("RideContext: Corrida aceita simulada:", rideData);
    return rideData; // Retorna os dados da corrida para possível redirecionamento com ID
  };

  // Simula a atualização da localização do motorista
  const simulate_updateDriverLocation = (newLocation) => {
    if (activeRide) {
      setActiveRide(prevRide => ({ ...prevRide, driverLocation: newLocation, status: 'PICKING_UP' }));
      setDriverLocation(newLocation); // Atualiza estado separado para re-renderização do mapa
      console.log("RideContext: Localização do motorista atualizada:", newLocation);
    }
  };

  // Simula o motorista chegando ao local de partida e iniciando a viagem
  const simulate_startTripToDestination = () => {
    if (activeRide) {
      setActiveRide(prevRide => ({ ...prevRide, status: 'IN_PROGRESS' }));
      console.log("RideContext: Viagem iniciada para o destino.");
      // Poderia iniciar outra simulação de movimento aqui, se necessário
    }
  };

  // Adiciona uma corrida ao histórico (chamado quando uma corrida é concluída ou cancelada)
  const addRideToHistory = (ride) => {
    // Adiciona a corrida no início da lista para que as mais recentes apareçam primeiro
    setRideHistory(prevHistory => [ride, ...prevHistory]);
    console.log("RideContext: Corrida adicionada ao histórico:", ride);
  };

  // Limpa a corrida ativa (cancelamento ou conclusão)
  const simulate_cancelRide = () => {
    if (activeRide) {
      const cancelledRide = {
        ...activeRide,
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        pickupAddress: activeRide.pickupLocation ? `Lat: ${activeRide.pickupLocation.lat.toFixed(4)}, Lng: ${activeRide.pickupLocation.lng.toFixed(4)}` : 'Não definido',
        destinationAddress: activeRide.destinationLocation ? `Lat: ${activeRide.destinationLocation.lat.toFixed(4)}, Lng: ${activeRide.destinationLocation.lng.toFixed(4)}` : 'Não definido',
        driverName: activeRide.driverInfo?.name || 'N/A',
        carDetails: activeRide.carInfo ? `${activeRide.carInfo.model} - ${activeRide.carInfo.plate}` : 'N/A',
        fare: 0.00, // Normalmente cancelamentos não cobram, ou cobram taxa mínima
        status: 'Cancelada',
      };
      addRideToHistory(cancelledRide);
    }

    if (locationUpdateInterval) {
      clearInterval(locationUpdateInterval);
      locationUpdateInterval = null;
    }
    setActiveRide(null);
    setDriverLocation(null);
    console.log("RideContext: Corrida cancelada/finalizada e adicionada ao histórico.");
  };

  // Exemplo de como uma corrida concluída poderia ser adicionada ao histórico
  // Esta função seria chamada no final da simulação de IN_PROGRESS em TrackRidePage, por exemplo.
  const simulate_completeRide = (finalFare) => {
    if (activeRide) {
      const completedRide = {
        ...activeRide, // Assume que activeRide tem pickupLocation, destinationLocation, driverInfo, carInfo
        id: activeRide.id || `ride_completed_${Date.now()}`,
        date: new Date().toLocaleDateString('pt-BR'),
        time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        pickupAddress: `Lat: ${activeRide.pickupLocation.lat.toFixed(4)}, Lng: ${activeRide.pickupLocation.lng.toFixed(4)}`,
        destinationAddress: `Lat: ${activeRide.destinationLocation.lat.toFixed(4)}, Lng: ${activeRide.destinationLocation.lng.toFixed(4)}`,
        driverName: activeRide.driverInfo.name,
        carDetails: `${activeRide.carInfo.model} - ${activeRide.carInfo.plate}`,
        fare: finalFare || activeRide.estimatedPrice || 0,
        status: 'Concluída',
        rated: false, // Nova corrida concluída ainda não foi avaliada
      };
      addRideToHistory(completedRide);
      setRideToRateDetails(completedRide); // Prepara para avaliação
      setActiveRide(null);
      setDriverLocation(null);
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        locationUpdateInterval = null;
      }
      console.log("RideContext: Corrida concluída, adicionada ao histórico e pronta para avaliação:", completedRide);
    }
  };

  const clearRideToRate = () => {
    const rideIdToMark = rideToRateDetails?.id;
    setRideToRateDetails(null);
    if (rideIdToMark) {
      setRideHistory(prevHistory =>
        prevHistory.map(ride =>
          ride.id === rideIdToMark ? { ...ride, rated: true } : ride
        )
      );
      console.log(`RideContext: Corrida ${rideIdToMark} marcada como avaliada e rideToRateDetails limpo.`);
    }
  };


  // Efeito para limpar o intervalo se o contexto for destruído ou activeRide mudar
  useEffect(() => {
    return () => {
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
      }
    };
  }, [activeRide]);


  // --- Funções para Motorista ---
  const simulate_newRideRequest = (rideDetails) => {
    // Adiciona uma nova corrida à lista de pendentes se não existir
    setPendingRides(prevRides => {
      if (prevRides.find(r => r.id === rideDetails.id)) {
        return prevRides; // Já existe, não adiciona duplicata
      }
      return [...prevRides, rideDetails];
    });
    console.log("RideContext: Nova solicitação de corrida simulada:", rideDetails);
  };

  const simulate_acceptRideByDriver = (rideDetailsFromDriver) => {
    // Remove da lista de pendentes
    setPendingRides(prevRides => prevRides.filter(r => r.id !== rideDetailsFromDriver.id));

    // Define como corrida ativa para o sistema (passageiro e motorista verão esta corrida)
    // O driverInfo e carInfo vêm do driverDetails que o DriverDashboardPage passou
    const acceptedRideData = {
      id: rideDetailsFromDriver.id,
      passengerInfo: { name: 'Passageiro Exemplo', id: `pass_${Date.now()}` }, // Simulado
      driverInfo: rideDetailsFromDriver.driverInfo,
      carInfo: rideDetailsFromDriver.carInfo,
      pickupLocation: rideDetailsFromDriver.pickupLocation,
      destinationLocation: rideDetailsFromDriver.destinationLocation,
      // A localização inicial do motorista para o trajeto até o passageiro
      driverLocation: rideDetailsFromDriver.driverCurrentLocation,
      status: 'PICKING_UP', // Motorista está a caminho do passageiro (similar ao que o passageiro vê)
      // Ou podemos usar 'ACCEPTED_BY_DRIVER' e depois o DriverRideNavigationPage muda para 'PICKING_UP' ao iniciar o movimento.
      // Para simplificar a sincronia com TrackRidePage, usar PICKING_UP aqui pode ser melhor.
      estimatedPrice: parseFloat(rideDetailsFromDriver.estimatedFare),
    };
    setActiveRide(acceptedRideData);
    setDriverLocation(acceptedRideData.driverLocation);
    console.log("RideContext: Motorista aceitou corrida, status PICKING_UP:", acceptedRideData);
    return acceptedRideData;
  };

  const simulate_driverArrivedAtPickup = (rideId) => {
    setActiveRide(prevRide => {
      if (prevRide && prevRide.id === rideId) {
        console.log(`RideContext: Motorista chegou ao local de embarque para corrida ${rideId}.`);
        return { ...prevRide, status: 'ARRIVED_AT_PICKUP' };
      }
      return prevRide;
    });
  };

  const simulate_tripStartedToDestination = (rideId) => {
    setActiveRide(prevRide => {
      if (prevRide && prevRide.id === rideId) {
        console.log(`RideContext: Motorista iniciou viagem ao destino para corrida ${rideId}.`);
        return { ...prevRide, status: 'IN_PROGRESS' }; // Reutiliza status 'IN_PROGRESS' que o passageiro também vê
      }
      return prevRide;
    });
  };

  const simulate_rejectRideByDriver = (rideId) => {
    setPendingRides(prevRides => prevRides.filter(r => r.id !== rideId));
    console.log(`RideContext: Motorista rejeitou corrida ${rideId}`);
    return Promise.resolve(); // Simula uma operação assíncrona
  };
  
  const clearPendingRides = () => {
    setPendingRides([]);
    console.log("RideContext: Todas as corridas pendentes foram limpas.");
  };


  // --- Valor do Contexto ---
  const value = {
    activeRide,
    driverLocation,
    rideHistory,
    rideToRateDetails,
    clearRideToRate,
    simulate_acceptRide, // Função original do passageiro para solicitar/aceitar
    simulate_updateDriverLocation, // Usado por ambos para atualizar localizações no mapa
    simulate_startTripToDestination, // Função do passageiro para mudar status (agora também usada pelo motorista)
    simulate_cancelRide,
    simulate_completeRide,
    addRideToHistory,
    locationUpdateInterval,
    setLocationUpdateInterval,

    // Para Motorista
    pendingRides,
    simulate_newRideRequest,
    simulate_acceptRideByDriver, // Motorista aceita uma corrida da lista de pendentes
    simulate_rejectRideByDriver,
    clearPendingRides,
    simulate_driverArrivedAtPickup,    // Motorista indica que chegou ao local de embarque
    simulate_tripStartedToDestination, // Motorista indica que iniciou a viagem ao destino (renomeado de simulate_startTripToDestination para clareza)
                                      // Nota: simulate_startTripToDestination original era para o *passageiro* ver o início da viagem.
                                      // A nova simulate_tripStartedToDestination é a ação do *motorista*.
                                      // Se o status 'IN_PROGRESS' é compartilhado, isso pode ser unificado ou renomeado com cuidado.
                                      // Por ora, manterei a nova para a ação do motorista.
  };

  return <RideContext.Provider value={value}>{children}</RideContext.Provider>;
};

export { RideContext };
