const token = localStorage.getItem('token');

if (!token) {
  window.location.href = 'login.html';
}

let payload;
try {
  payload = JSON.parse(atob(token.split('.')[1]));
} catch (err) {
  alert('Błędny token. Zaloguj się ponownie.');
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

if (payload.role !== 'admin') {
  alert('Brak dostępu: tylko dla admina');
  window.location.href = 'test1.html';
}

async function fetchAllComplaints() {
    const response = await fetch('http://localhost:3001/api/complaint',{
        headers:{
        'Authorization': `Bearer ${token}`
        }
    });

    if(!response.ok){
        console.error('problem witch fetch to complaints');
        return;
    }
    const complaints=await response.json();
    const complaintcontainer=document.getElementById('complaintlist');
    complaintcontainer.innerHTML = '';

    complaints.forEach(complaint => {
        const complaintElement=document.createElement('div'); 
        complaintElement.classList.add('');
        complaintElement.innerHTML=`
        <h3>Complaint ID: ${complaint._id}</h3>
        <p>User: ${complaint.userId.username}</p>
        <p>Item ${complaint.total} PLN</p>
        <p>OpisProblemu ${complaint.opisproblem} PLN</p>
        <hr>
        `;
        document.getElementById('complaintsContainer').appendChild(complaintElement);
    });
}

fetchAllComplaints();